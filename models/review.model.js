import mongoose from 'mongoose';

// Product review / feedback schema — a user can leave only one review per product
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
    // whether this user actually purchased the product (true if a delivered order exists)
    verifiedPurchase: {
        type: Boolean,
        default: false
    },
    // "Helpful" feedback — vote count
    helpful: {
        type: Number,
        default: 0,
        min: 0
    },
    // voters — a user cannot vote twice
    helpfulBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true })

// one review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true })
// speeds up loading recent reviews per product
reviewSchema.index({ productId: 1, createdAt: -1 })

const REVIEW = mongoose.model('Review', reviewSchema)

export default REVIEW;