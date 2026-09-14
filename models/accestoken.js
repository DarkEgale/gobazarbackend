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
    // TTL index — access tokens live only 15 minutes; the session doc auto-deletes after 1 day
    // (previously every refresh created a new doc and stale ones kept piling up)
    createdAt: {
        type: Date,
        expires: '1d'
    }
})

const ATH = mongoose.model('Access Token', accessToken)
export default ATH;