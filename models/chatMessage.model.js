import mongoose from 'mongoose';

// Customer support chat message.
// userId = the customer the conversation belongs to,
// sender = who wrote the message ('user' or 'admin').
const chatMessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: String,
        enum: ['user', 'admin'],
        required: true
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        maxlength: [1000, 'Message can not exceed 1000 characters']
    },
    readByAdmin: {
        type: Boolean,
        default: false
    },
    readByUser: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

chatMessageSchema.index({ userId: 1, createdAt: 1 });

const CHATMESSAGE = mongoose.model('ChatMessage', chatMessageSchema);

export default CHATMESSAGE;