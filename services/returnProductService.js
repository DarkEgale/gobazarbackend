import RETURNPRODUCT from '../models/returnProduct.model.js';
import ORDER from '../models/order.model.js';
import Products from '../models/products.model.js';
import { restockItems, RETURN_WINDOW_DAYS } from './orderService.js';
import { emitToAdmins, emitToUser } from '../utils/socket.js';
import { logSuccess, logInfo } from '../utils/logger.js';

/* =========================================================
   CREATE RETURN REQUEST (customer, after delivery, within 7 days)
   ========================================================= */

const createReturnRequest = async (userId, orderId, phone, products) => {
    try {
        if (!userId) {
            throw new Error('userId Required');
        }

        if (!orderId) {
            throw new Error('Order id is required');
        }

        if (!phone) {
            throw new Error('Phone number is required');
        }

        if (!/^[0-9+\-\s]{6,20}$/.test(String(phone).trim())) {
            throw new Error('Please enter a valid phone number');
        }

        // valid ObjectId guard — avoids ugly mongoose CastError messages
        if (!/^[0-9a-fA-F]{24}$/.test(String(orderId))) {
            throw new Error('Invalid order id');
        }

        if (!Array.isArray(products) || products.length === 0) {
            throw new Error('Please select at least one product to return');
        }

        const order = await ORDER.findOne({ _id: orderId, userId });

        if (!order) {
            throw new Error('Order not found');
        }

        if (order.orderStatus === 'cancelled') {
            throw new Error('Cancelled orders can not be returned');
        }

        if (order.orderStatus !== 'deliverd') {
            throw new Error('Only delivered orders can be returned');
        }

        if (!order.deliveredAt) {
            throw new Error('Delivery date not found for this order');
        }

        // ----- 7-day return window -----
        const elapsed = Date.now() - new Date(order.deliveredAt).getTime();
        if (elapsed > RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
            throw new Error(
                `Return window expired. Products can only be returned within ${RETURN_WINDOW_DAYS} days of delivery.`
            );
        }

        /* ----- How much of each product is already requested for return -----
           (pending / on_the_way / returned — all count, so the customer can not
            return more than the ordered quantity across multiple requests) */
        const existingReturns = await RETURNPRODUCT.find({ orderId }).lean();
        const requestedMap = {};
        for (const ret of existingReturns) {
            for (const p of ret.products || []) {
                const key = `${p.productId}_${p.variantId || 'base'}`;
                requestedMap[key] = (requestedMap[key] || 0) + p.quantity;
            }
        }

        const returnProducts = await Promise.all(
            products.map(async (item) => {

                if (!item.productId) {
                    throw new Error('Product ID is required');
                }

                if (!item.quantity || item.quantity < 1) {
                    throw new Error('Invalid return quantity');
                }

                const key = `${item.productId}_${item.variantId || 'base'}`;

                // The product (with the same variant) must belong to this order
                const orderItem = order.products.find((p) =>
                    String(p.productId) === String(item.productId) &&
                    (item.variantId
                        ? String(p.variantId) === String(item.variantId)
                        : !p.variantId)
                );

                if (!orderItem) {
                    throw new Error('This product does not belong to the order');
                }

                const alreadyRequested = requestedMap[key] || 0;
                const available = orderItem.quantity - alreadyRequested;

                if (available <= 0) {
                    throw new Error('All items of this product are already requested for return');
                }

                if (item.quantity > available) {
                    throw new Error(`You can return a maximum of ${available} item(s) of this product`);
                }

                // Product snapshot (title / variant attributes)
                const product = await Products.findById(item.productId)
                    .select('title hasVariants verients');

                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }

                let variantId = item.variantId || undefined;
                let variantAttributes = null;

                if (product.hasVariants) {
                    if (!variantId) {
                        throw new Error('Please select the variant you are returning');
                    }

                    const variant = product.verients.find(
                        (v) => String(v._id) === String(variantId)
                    );

                    if (!variant) {
                        throw new Error('Selected variant not found');
                    }

                    variantAttributes = variant.attributes || null;
                } else {
                    variantId = undefined;
                }

                // Refund-eligible unit price — the order stores the final (discounted) price.
                // Delivery charge is NOT part of this → delivery charge is never refunded.
                return {
                    productId: product._id,
                    variantId: variantId || undefined,
                    variantAttributes,
                    title: product.title,
                    quantity: item.quantity,
                    price: orderItem.price
                };
            })
        );

        const returnRequest = await RETURNPRODUCT.create({
            userId,
            orderId,
            phone: String(phone).trim(),
            products: returnProducts
        });

        if (!returnRequest) {
            throw new Error('Failed to create return request');
        }

        logSuccess('return.create', `Return request #${returnRequest._id} created for order #${orderId}`, { orderId, userId });
        emitToAdmins('notification', {
            type: 'return',
            title: 'New Return Request',
            message: `A customer requested a return for order #${String(orderId).slice(-6).toUpperCase()}`,
        });

        return returnRequest;
    } catch (error) {
        throw error;
    }
};

/* =========================================================
   GET MY RETURNS (customer)
   ========================================================= */

const getMyReturns = async (userId) => {
    try {
        if (!userId) {
            throw new Error('userId Required');
        }

        const returns = await RETURNPRODUCT.find({ userId })
            .populate({ path: 'orderId', model: 'Order', select: 'orderStatus subtotal deliveryCharge totalAmount deliveredAt createdAt' })
            .populate({
                path: 'products.productId',
                model: 'Products',
                select: 'title thumbnil'
            })
            .sort({ createdAt: -1 });

        return returns;
    } catch (error) {
        throw error;
    }
};

/* =========================================================
   GET ALL RETURNS (admin — Return Collection)
   ========================================================= */

const getAllReturns = async (page = 1, limit = 50) => {
    try {
        page = Math.max(1, Number(page));
        limit = Math.min(100, Math.max(1, Number(limit)));

        const totalReturns = await RETURNPRODUCT.countDocuments({});
        const totalPages = Math.ceil(totalReturns / limit) || 1;

        const returns = await RETURNPRODUCT.find({})
            .populate({ path: 'userId', model: 'User', select: 'name email phone' })
            .populate({ path: 'orderId', model: 'Order', select: 'orderStatus subtotal deliveryCharge totalAmount deliveredAt createdAt' })
            .populate({
                path: 'products.productId',
                model: 'Products',
                select: 'title thumbnil'
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return { returns, totalReturns, totalPages, page, limit };
    } catch (error) {
        throw error;
    }
};

/* =========================================================
   UPDATE RETURN STATUS (admin)
   pending → on_the_way → returned
   'returned' (confirmed) → the stock is incremented back
   ========================================================= */

const ALLOWED_RETURN_STATUSES = ['pending', 'on_the_way', 'returned'];

const updateReturnStatus = async (returnId, status) => {
    try {
        if (!ALLOWED_RETURN_STATUSES.includes(status)) {
            throw new Error(
                `Invalid return status. Allowed: ${ALLOWED_RETURN_STATUSES.join(', ')}`
            );
        }

        const returnRequest = await RETURNPRODUCT.findById(returnId);
        if (!returnRequest) {
            throw new Error('Return request not found');
        }

        // Stock is given back exactly once — when the return is confirmed
        if (status === 'returned' && returnRequest.status !== 'returned') {
            await restockItems(returnRequest.products);
        }

        returnRequest.status = status;
        await returnRequest.save();

        logInfo('return.status', `Return #${returnId} → ${status}`, { returnId, status });
        emitToUser(returnRequest.userId, 'notification', {
            type: 'return',
            title: 'Return Update',
            message:
                status === 'returned'
                    ? 'Your return was confirmed — the product price will be refunded (delivery charge excluded).'
                    : `Your return request is now ${status}`,
        });
        if (status === 'returned') {
            emitToAdmins('notification', {
                type: 'return',
                title: 'Return Confirmed',
                message: `Return #${String(returnId).slice(-6).toUpperCase()} confirmed — stock restored`,
            });
        }

        return returnRequest;
    } catch (error) {
        throw error;
    }
};

export {
    createReturnRequest,
    getMyReturns,
    getAllReturns,
    updateReturnStatus,
    ALLOWED_RETURN_STATUSES
};
export default { createReturnRequest, getMyReturns, getAllReturns, updateReturnStatus };