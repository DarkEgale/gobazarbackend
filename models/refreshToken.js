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
        index: true // every query goes through ssId — keeps lookups fast
    },
    // TTL index — refresh tokens expire after 30 days, so the doc auto-deletes shortly after
    // (an abandoned session will not sit in the DB forever)
    createdAt: {
        type: Date,
        expires: '31d'
    }
})

const RTH = mongoose.model('RefreshToken', refreshToken)
export default RTH;