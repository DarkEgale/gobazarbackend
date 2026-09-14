import mongoose from 'mongoose';

// Product Return Request
// - Created by the customer AFTER delivery (within a 7-day window)
// - "returned" status (set by admin) triggers the stock increment
const returnProductSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User id is required']
    },
    // Order number this return belongs to ("num")
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'Order id is required']
    },
    // Customer phone number (String — keeps the leading 0 of BD mobile numbers)
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    // Returned product data (an order can contain multiple products/variants)
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Products',
                required: true
            },
            // Only present when the product has variants
            variantId: {
                type: mongoose.Schema.Types.ObjectId
            },
            // Snapshot of variant attributes (e.g. { color: "Black", size: "XL" })
            variantAttributes: {
                type: mongoose.Schema.Types.Mixed
            },
            title: {
                type: String
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            // Refund-eligible unit price (delivery charge is NOT refunded)
            price: {
                type: Number,
                required: true
            }
        }
    ],
    status: {
        type: String,
        enum: ['pending', 'on_the_way', 'returned'],
        default: 'pending'
    }
}, { timestamps: true })

returnProductSchema.index({ userId: 1, createdAt: -1 });
returnProductSchema.index({ status: 1 });

const RETURNPRODUCT = mongoose.model('ReturnProduct', returnProductSchema);

export default RETURNPRODUCT;