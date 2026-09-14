import {
    sendMessage,
    getMyConversation,
    getConversations,
    getConversationByUser,
    markConversationRead,
} from '../modules/serviceModule.js';
import { Response } from '../modules/module.js';

// customer sends a message (own conversation)
const sendMessageController = async (req, res) => {
    try {
        const { message } = req.body;
        const created = await sendMessage({
            userId: req.user.userId,
            sender: 'user',
            message,
        });
        return Response(res, true, 201, 'Message sent', created);
    } catch (error) {
        console.log('[Send Message]', error);
        return Response(res, false, 400, error.message || 'Failed to send message');
    }
}

// admin replies into a customer's conversation
const sendAdminMessageController = async (req, res) => {
    try {
        const { userId, message } = req.body;
        if (!userId) {
            return Response(res, false, 400, 'userId is required');
        }
        const created = await sendMessage({ userId, sender: 'admin', message });
        return Response(res, true, 201, 'Message sent', created);
    } catch (error) {
        console.log('[Send Admin Message]', error);
        return Response(res, false, 400, error.message || 'Failed to send message');
    }
}

// customer: own conversation
const getMyConversationController = async (req, res) => {
    try {
        const messages = await getMyConversation(req.user.userId);
        return Response(res, true, 200, 'Conversation found', messages);
    } catch (error) {
        console.log('[Get My Conversation]', error);
        return Response(res, false, 500, error.message || 'Failed to fetch conversation');
    }
}

// admin: all conversations
const getConversationsController = async (req, res) => {
    try {
        const conversations = await getConversations();
        return Response(res, true, 200, 'Conversations found', conversations);
    } catch (error) {
        console.log('[Get Conversations]', error);
        return Response(res, false, 500, error.message || 'Failed to fetch conversations');
    }
}

// admin: one conversation
const getConversationController = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return Response(res, false, 400, 'userId is required');
        }
        const messages = await getConversationByUser(userId);
        // mark as read by admin
        await markConversationRead({ userId, reader: 'admin' });
        return Response(res, true, 200, 'Conversation found', messages);
    } catch (error) {
        console.log('[Get Conversation]', error);
        return Response(res, false, 500, error.message || 'Failed to fetch conversation');
    }
}

export { sendMessageController, sendAdminMessageController, getMyConversationController, getConversationsController, getConversationController };