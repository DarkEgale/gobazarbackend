import express from 'express';
import userProtect from '../../middlewares/userProtect.js';
import adminProtect from '../../middlewares/adminProtect.js';
import {
    sendMessageController,
    sendAdminMessageController,
    getMyConversationController,
    getConversationsController,
    getConversationController,
} from '../../modules/controllerModule.js';

const router = express.Router();

// customer
router.post('/send', userProtect, sendMessageController);
router.get('/my', userProtect, getMyConversationController);

// admin
router.post('/admin/send', userProtect, adminProtect, sendAdminMessageController);
router.get('/conversations', userProtect, adminProtect, getConversationsController);
router.get('/conversation/:userId', userProtect, adminProtect, getConversationController);

export default router;