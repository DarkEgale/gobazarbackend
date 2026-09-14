import mongoose from 'mongoose';

// System log — one document per important action.
// The TTL index (expireAfterSeconds = 30 days) makes MongoDB delete old
// documents automatically, so the collection never grows unbounded.
const logSchema = new mongoose.Schema({
    level: {
        type: String,
        enum: ['info', 'success', 'warn', 'error'],
        default: 'info'
    },
    action: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    meta: {
        type: mongoose.Schema.Types.Mixed
    }
}, { timestamps: true });

// auto-delete documents 30 days after creation
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
logSchema.index({ createdAt: -1 });
logSchema.index({ level: 1 });

const LOG = mongoose.model('Log', logSchema);

export default LOG;