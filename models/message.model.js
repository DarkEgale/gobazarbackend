import mongoose, { Types } from 'mongoose';
const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    reciverId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    message: {
        type: String,
        required: true
    }
}, { timestamps: true })
const Message = mongoose.model('Message', messageSchema)
export default Message;