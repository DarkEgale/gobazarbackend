import mongoose from 'mongoose';



const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: [true, 'userId is required']
    },
    productId: {
        type: mongoose.Types.ObjectId,
        required: [true, 'Product id is required']
    }
}, { timestamps: true })

const WishList = mongoose.model('WishList', wishlistSchema)

export default WishList;