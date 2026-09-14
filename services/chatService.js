import CHATMESSAGE from '../models/chatMessage.model.js';
import { emitToUser, emitToAdmins } from '../utils/socket.js';
import { writeLog } from '../utils/logger.js';

// send a message — from a customer (own conversation) or from an admin
const sendMessage = async ({ userId, sender, message }) => {
    try {
        if (!userId) {
            throw new Error('userId is required');
        }
        if (!message || !String(message).trim()) {
            throw new Error('Message can not be empty');
        }

        const created = await CHATMESSAGE.create({
            userId,
            sender,
            message: String(message).trim().slice(0, 1000),
        });

        const payload = {
            _id: created._id,
            userId: created.userId,
            sender: created.sender,
            message: created.message,
            createdAt: created.createdAt,
        };

        // real-time delivery — to the customer and to every admin
        emitToUser(userId, 'chat:message', payload);
        emitToAdmins('chat:message', payload);

        return payload;
    } catch (error) {
        throw error;
    }
};

// customer: own conversation (oldest → newest)
const getMyConversation = async (userId) => {
    try {
        return await CHATMESSAGE.find({ userId }).sort({ createdAt: 1 }).lean();
    } catch (error) {
        throw error;
    }
};

// admin: list of all conversations (last message + unread count per user)
const getConversations = async () => {
    try {
        return await CHATMESSAGE.aggregate([
            { $sort: { createdAt: 1 } },
            {
                $group: {
                    _id: '$userId',
                    lastMessage: { $last: '$message' },
                    lastSender: { $last: '$sender' },
                    lastAt: { $last: '$createdAt' },
                    unread: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ['$sender', 'user'] }, { $eq: ['$readByAdmin', false] }] },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            { $sort: { lastAt: -1 } },
        ]);
    } catch (error) {
        throw error;
    }
};

// admin: one conversation by userId (oldest → newest)
const getConversationByUser = async (userId) => {
    try {
        return await CHATMESSAGE.find({ userId }).sort({ createdAt: 1 }).lean();
    } catch (error) {
        throw error;
    }
};

// mark a conversation as read (by admin or by the customer)
const markConversationRead = async ({ userId, reader }) => {
    try {
        const filter = { userId };
        const update =
            reader === 'admin' ? { readByAdmin: true } : { readByUser: true };
        await CHATMESSAGE.updateMany(filter, update);
        return true;
    } catch (error) {
        throw error;
    }
};

export { sendMessage, getMyConversation, getConversations, getConversationByUser, markConversationRead };
export default { sendMessage, getMyConversation, getConversations, getConversationByUser, markConversationRead };