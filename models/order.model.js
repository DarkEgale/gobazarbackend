import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: [true, "user id is required"]
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            price: {
                type: Number,
                required: true
            },

            quantity: {
                type: Number,
                required: true,
                min: 1
            }
        }
    ],
    paymentMethod: {
        type: String,
        enum: ['bekash', 'nagad', 'cash']
    },
    paymentStatus: {
        type: String,
        enum: ['cash_on_delivery', 'pending', 'paid'],
        default: 'pending'
    },
    subtotal: {
        type: Number,
        default: 0
    },
    address: {
        type: String,
        required: [true, "Delivery address is required"],
        trim: true,
        maxlength: [500, "Address can not exceed 500 characters"]
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'shipping', 'shipped', 'on the way', 'deliverd'],
        default: "pending"
    },
    deliveryCharge: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    }
}, { timestamps: true })

const ORDER = mongoose.model('Order', orderSchema)

export default ORDER;