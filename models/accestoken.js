import mongoose from 'mongoose';


const accessToken = new mongoose.Schema({
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
        required: true,
        index: true
    },
    // TTL index — access token মাত্র ১৫ মিনিট বাঁচে, session doc ১ দিন পরেই auto-delete
    // (আগে প্রতিটা refresh এ নতুন doc তৈরি হতো, পুরনোগুলো জমতেই থাকত)
    createdAt: {
        type: Date,
        expires: '1d'
    }
})

const ATH = mongoose.model('Access Token', accessToken)
export default ATH;