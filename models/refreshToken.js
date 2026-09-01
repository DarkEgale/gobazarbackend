import mongoose from 'mongoose';

const refreshToken = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    currTokenHash: {
        type: String,
        required: true
    },
    preTokenHash: {
        type: String,
        default: null
    },
    ssId: {
        type: String,
        default: null,
        index: true // প্রতিটা query ssId দিয়েই হয় — lookup দ্রুত করার জন্য
    },
    // TTL index — refresh token ৩০ দিন পরে মরে, তাই doc ও তার পরেই auto-delete
    // (একটা session বানিয়ে ভুলে যাওয়া হলে DB-তে চিরতরে জমে থাকত না)
    createdAt: {
        type: Date,
        expires: '31d'
    }
})

const RTH = mongoose.model('RefreshToken', refreshToken)
export default RTH;