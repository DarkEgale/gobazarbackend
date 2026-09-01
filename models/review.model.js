import mongoose from 'mongoose';

// Product review / feedback schema — প্রতি user একটি product-এ একটাই review দিতে পারবে
const reviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
        required: [true, 'Product id is required']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User id is required']
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating can not exceed 5']
    },
    title: {
        type: String,
        trim: true,
        maxlength: [100, 'Title can not exceed 100 characters'],
        default: ''
    },
    comment: {
        type: String,
        required: [true, 'Review comment is required'],
        trim: true,
        minlength: [3, 'Review comment must be at least 3 characters'],
        maxlength: [1000, 'Review comment can not exceed 1000 characters']
    },
    // এই user সত্যিই product-টা কিনেছে কিনা (delivered order থাকলে true)
    verifiedPurchase: {
        type: Boolean,
        default: false
    },
    // "Helpful" feedback — কতজন vote করেছে
    helpful: {
        type: Number,
        default: 0,
        min: 0
    },
    // কারা vote করেছে — একই user দুবার vote করতে না পারে
    helpfulBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true })

// একই user একই product-এ একটাই review
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true })
// product ভিত্তিক সাম্প্রতিক review দ্রুত লোড হওয়ার জন্য
reviewSchema.index({ productId: 1, createdAt: -1 })

const REVIEW = mongoose.model('Review', reviewSchema)

export default REVIEW;