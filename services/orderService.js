import ORDER from '../models/order.model.js';
import Products from '../models/products.model.js';

// Delivery is charged once per order (not per product).
// Orders ship as one consignment -> highest per-product delivery charge applies.
// Orders above this subtotal get free delivery.
const FREE_DELIVERY_THRESHOLD = 2000;

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

                const product = await Products.findById(item.productId)
                    .select('_id price discount delivary');

                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }

                const discount = product.discount || 0;

                const finalPrice =
                    product.price - (product.price * discount / 100);

                return {
                    productId: product._id,
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

        // Delivery charge per order — free when subtotal crosses the threshold
        const deliveryCharge = subtotal > FREE_DELIVERY_THRESHOLD
            ? 0
            : orderProducts.reduce(
                (max, item) => Math.max(max, item.delivary),
                0
            );

        const totalAmount = subtotal + deliveryCharge;

        const order = await ORDER.create({
            userId,
            address: address.trim(),
            phone: phone,
            products: orderProducts.map(({ productId, price, quantity }) => ({
                productId,
                price,
                quantity
            })),
            paymentMethod,
            paymentStatus: 'cash_on_delivery',
            subtotal,
            deliveryCharge,
            totalAmount
        });

        if (!order) {
            throw new Error('Order Creation Failed');
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

// update order status (only for admin)
const updateOrderStatus = async (orderId, orderStatus) => {
    try {
        const updatedOrder = await ORDER.findByIdAndUpdate(orderId, { orderStatus: orderStatus }, { new: true })
        if (!updatedOrder) {
            throw new Error('Failed to update order');
        }
        return updatedOrder;
    } catch (error) {
        throw error
    }
}

export { createOrder, getMyOrders, getAllOrders, getOrderById, FREE_DELIVERY_THRESHOLD, updateOrderStatus };