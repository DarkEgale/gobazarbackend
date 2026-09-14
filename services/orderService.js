import ORDER from '../models/order.model.js';
import Products from '../models/products.model.js';
import { getSettings } from './settingService.js';
import { emitToAdmins, emitToUser } from '../utils/socket.js';
import { logSuccess, logInfo, logWarn } from '../utils/logger.js';

// Delivery is charged once per order (not per product).
// Orders ship as one consignment -> highest per-product delivery charge applies.
// Orders above this subtotal get free delivery.
const FREE_DELIVERY_THRESHOLD = 2000;

// How many days after delivery a customer can request a product return
export const RETURN_WINDOW_DAYS = 7;

/* =========================================================
   STOCK HELPERS
   - hasVariants = true  → stock lives on each variant
   - hasVariants = false → stock lives on the product itself
   ========================================================= */

// Atomic, race-safe decrement. Returns false when there is not enough stock.
const decrementStock = async (productId, variantId, quantity) => {
    if (variantId) {
        // $elemMatch guarantees ONE variant matches BOTH the id and the stock condition
        const result = await Products.updateOne(
            {
                _id: productId,
                verients: { $elemMatch: { _id: variantId, stock: { $gte: quantity } } }
            },
            {
                $inc: {
                    'verients.$.stock': -quantity, // variant-level stock
                    stock: -quantity               // product total (kept in sync)
                }
            }
        );
        return result.matchedCount === 1;
    }

    const result = await Products.updateOne(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } }
    );
    return result.matchedCount === 1;
};

// Increment stock back (order cancel / return confirmed)
const incrementStock = async (productId, variantId, quantity) => {
    if (variantId) {
        await Products.updateOne(
            { _id: productId, verients: { $elemMatch: { _id: variantId } } },
            {
                $inc: {
                    'verients.$.stock': quantity,
                    stock: quantity
                }
            }
        );
    } else {
        await Products.updateOne(
            { _id: productId },
            { $inc: { stock: quantity } }
        );
    }
};

// Restock every item of an order / return request
const restockItems = async (items) => {
    for (const item of items) {
        await incrementStock(item.productId, item.variantId, item.quantity);
    }
};

const createOrder = async (userId, products, paymentMethod, address, phone) => {
    try {
        if (!userId) {
            throw new Error('userId Required');
        }

        if (!paymentMethod) {
            throw new Error('Please select a payment method');
        }

        if (!address || typeof address !== 'string' || !address.trim()) {
            throw new Error('Please enter your delivery address');
        }

        // Online payment is not integrated yet — only Cash on Delivery is accepted.
        if (paymentMethod !== 'cash') {
            throw new Error('Online payment is not available yet. Please select Cash on Delivery.');
        }

        if (!Array.isArray(products) || products.length === 0) {
            throw new Error('Products are required');
        }

        const orderProducts = await Promise.all(
            products.map(async (item) => {

                if (!item.productId) {
                    throw new Error('Product ID is required');
                }

                if (!item.quantity || item.quantity < 1) {
                    throw new Error('Invalid product quantity');
                }

                // hasVariants + verients included so variant pricing is possible
                const product = await Products.findById(item.productId)
                    .select('_id price discount delivary hasVariants verients');

                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }

                const discount = product.discount || 0;
                let finalPrice;
                let variantId = null;
                let variantAttributes = null;

                if (product.hasVariants) {
                    /* ----- VARIANT PRODUCT: price comes from the selected variant ----- */

                    if (!item.variantId) {
                        throw new Error(
                            `Please select a variant for product: ${item.productId} (this product has variants)`
                        );
                    }

                    const variant = product.verients.find(
                        (v) => String(v._id) === String(item.variantId)
                    );

                    if (!variant) {
                        throw new Error(`Selected variant not found for product: ${item.productId}`);
                    }

                    if (variant.price === undefined || variant.price === null) {
                        throw new Error(`Selected variant has no price for product: ${item.productId}`);
                    }

                    // Variant-level price — product-level discount still applies
                    finalPrice = variant.price - (variant.price * discount / 100);
                    variantId = variant._id;
                    variantAttributes = variant.attributes || null;
                } else {
                    /* ----- SIMPLE PRODUCT: product-level price ----- */

                    if (item.variantId) {
                        throw new Error(`This product has no variants: ${item.productId}`);
                    }

                    finalPrice = product.price - (product.price * discount / 100);
                }

                return {
                    productId: product._id,
                    variantId,
                    variantAttributes,
                    price: finalPrice,
                    quantity: item.quantity,
                    delivary: product.delivary || 0
                };
            })
        );

        // Subtotal (discount-aware)
        const subtotal = orderProducts.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        // settings — free-delivery threshold + default delivery charge are
        // managed from the admin Settings tab (server-synced)
        const settings = await getSettings().catch(() => null);
        const threshold =
            Number(settings?.freeDeliveryThreshold) || FREE_DELIVERY_THRESHOLD;

        const maxDelivary = orderProducts.reduce(
            (max, item) => Math.max(max, item.delivary),
            0
        );

        // Delivery charge per order — free when subtotal crosses the threshold
        const deliveryCharge = subtotal > threshold
            ? 0
            : maxDelivary > 0
                ? maxDelivary
                : Number(settings?.defaultDeliveryCharge) || 0;

        const totalAmount = subtotal + deliveryCharge;

        /* ----- STOCK: decrement before creating the order -----
           If any item is out of stock, nothing is saved (fails before ORDER.create). */
        for (const item of orderProducts) {
            const ok = await decrementStock(item.productId, item.variantId, item.quantity);
            if (!ok) {
                throw new Error(
                    `Insufficient stock for product: ${item.productId}${item.variantId ? ' (selected variant)' : ''}`
                );
            }
        }

        let order;
        try {
            order = await ORDER.create({
                userId,
                address: address.trim(),
                phone: phone,
                products: orderProducts.map(({ productId, variantId, variantAttributes, price, quantity }) => ({
                    productId,
                    variantId,
                    variantAttributes,
                    price,
                    quantity
                })),
                paymentMethod,
                paymentStatus: 'cash_on_delivery',
                subtotal,
                deliveryCharge,
                totalAmount
            });
        } catch (err) {
            // Order failed → give the reserved stock back
            for (const item of orderProducts) {
                await incrementStock(item.productId, item.variantId, item.quantity).catch(() => {});
            }
            throw err;
        }

        if (!order) {
            // Safety net — restore the reserved stock
            for (const item of orderProducts) {
                await incrementStock(item.productId, item.variantId, item.quantity).catch(() => {});
            }
            throw new Error('Order Creation Failed');
        }

        // log + real-time notification to the admins
        logSuccess('order.create', `Order #${order._id} placed — ৳${totalAmount.toFixed(2)}`, { orderId: order._id, userId });
        if (settings?.notifications?.newOrderAlerts !== false) {
            emitToAdmins('notification', {
                type: 'order',
                title: 'New Order',
                message: `New order placed — ৳${totalAmount.toFixed(2)}`,
            });
        }

        // low stock alerts (checked after the stock decrement)
        if (settings?.notifications?.lowStockAlerts !== false) {
            const lowThreshold = Number(settings?.lowStockThreshold) || 5;
            for (const item of orderProducts) {
                const fresh = await Products.findById(item.productId)
                    .select('title stock hasVariants verients');
                if (!fresh) continue;
                const minStock = fresh.hasVariants
                    ? Math.min(...(fresh.verients || []).map((v) => Number(v.stock) || 0))
                    : Number(fresh.stock) || 0;
                if (minStock <= lowThreshold) {
                    logWarn('stock.low', `${fresh.title} is low on stock (${minStock} left)`, { productId: fresh._id });
                    emitToAdmins('notification', {
                        type: 'stock',
                        title: 'Low Stock',
                        message: `${fresh.title} — only ${minStock} left`,
                    });
                }
            }
        }

        return order;

    } catch (error) {
        throw error;
    }
};

// Fetch all orders of a user (newest first) with product details
const getMyOrders = async (userId) => {
    try {
        if (!userId) {
            throw new Error('userId Required');
        }

        // ref is "Product" but the model is registered as "Products" → explicit model
        const orders = await ORDER.find({ userId })
            .populate({
                path: 'products.productId',
                model: 'Products',
                select: 'title thumbnil price discount'
            })
            .sort({ createdAt: -1 });

        return orders;
    } catch (error) {
        throw error;
    }
};

// Fetch all orders (Admin) with user and product details
const getAllOrders = async (page = 1, limit = 50) => {
    try {
        page = Math.max(1, Number(page));
        limit = Math.min(100, Math.max(1, Number(limit)));

        const totalOrders = await ORDER.countDocuments({});
        const totalPages = Math.ceil(totalOrders / limit) || 1;

        // ref is "Product" but the model is registered as "Products" → explicit model
        const orders = await ORDER.find({})
            .populate({
                path: 'userId',
                model: 'User',
                select: 'name email avatar'
            })
            .populate({
                path: 'products.productId',
                model: 'Products',
                select: 'title thumbnil price discount'
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return { orders, totalOrders, totalPages, page, limit };
    } catch (error) {
        throw error;
    }
};

// Fetch a single order of the logged-in user by id (with product details)
const getOrderById = async (userId, orderId) => {
    try {
        if (!userId) {
            throw new Error('userId Required');
        }

        if (!orderId) {
            throw new Error('orderId Required');
        }

        // ref is "Product" but the model is registered as "Products" → explicit model
        const order = await ORDER.findOne({ _id: orderId, userId })
            .populate({
                path: 'products.productId',
                model: 'Products',
                select: 'title thumbnil price discount'
            });

        if (!order) {
            throw new Error('Order not found');
        }

        return order;
    } catch (error) {
        throw error;
    }
};

/* =========================================================
   CANCEL ORDER — user cancels a pending order → stock back
   ========================================================= */

const cancelOrder = async (userId, orderId) => {
    try {
        if (!userId) {
            throw new Error('userId Required');
        }

        if (!orderId) {
            throw new Error('orderId Required');
        }

        const order = await ORDER.findOne({ _id: orderId, userId });

        if (!order) {
            throw new Error('Order not found');
        }

        if (order.orderStatus === 'cancelled') {
            throw new Error('Order is already cancelled');
        }

        // Customer can only cancel BEFORE the shipping process starts
        if (order.orderStatus !== 'pending') {
            throw new Error('Only pending orders can be cancelled. Please contact support.');
        }

        // Give the stock back
        await restockItems(order.products);

        order.orderStatus = 'cancelled';
        await order.save();

        logWarn('order.cancel', `Order #${orderId} cancelled by the customer — stock restored`, { orderId });
        emitToAdmins('notification', {
            type: 'order',
            title: 'Order Cancelled',
            message: `Order #${String(orderId).slice(-6).toUpperCase()} was cancelled — stock restored`,
        });

        return order;
    } catch (error) {
        throw error;
    }
};

// update order status (only for admin)
const updateOrderStatus = async (orderId, orderStatus) => {
    try {
        const order = await ORDER.findById(orderId);
        if (!order) {
            throw new Error('Failed to update order');
        }

        // A delivered order can not be cancelled
        if (orderStatus === 'cancelled' && order.orderStatus === 'deliverd') {
            throw new Error('Delivered orders can not be cancelled');
        }

        // Restock once, when the order transitions INTO 'cancelled'
        if (orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
            await restockItems(order.products);
        }

        order.orderStatus = orderStatus;

        // Record the delivery time — the 7-day return window starts from here.
        // Re-marking an already delivered order (without a delivery date, e.g.
        // old orders) also sets it — making the return window active for it.
        if (
          orderStatus === 'deliverd' &&
          (order.orderStatus !== 'deliverd' || !order.deliveredAt)
        ) {
            order.deliveredAt = new Date();
        }

        await order.save();

        logInfo('order.status', `Order #${orderId} → ${orderStatus}`, { orderId, orderStatus });

        // real-time notification to the customer + admins
        emitToUser(order.userId, 'notification', {
            type: 'order',
            title: 'Order Update',
            message: `Your order #${String(orderId).slice(-6).toUpperCase()} is now ${orderStatus}`,
        });
        if (orderStatus === 'cancelled') {
            emitToAdmins('notification', {
                type: 'order',
                title: 'Order Cancelled',
                message: `Order #${String(orderId).slice(-6).toUpperCase()} cancelled by admin — stock restored`,
            });
        }

        return order;
    } catch (error) {
        throw error;
    }
}

export { createOrder, getMyOrders, getAllOrders, getOrderById, FREE_DELIVERY_THRESHOLD, updateOrderStatus, cancelOrder, restockItems };