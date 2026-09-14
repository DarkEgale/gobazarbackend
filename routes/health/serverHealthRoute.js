import express from 'express';
import userProtect from '../../middlewares/userProtect.js';
import adminProtect from '../../middlewares/adminProtect.js';
import { getServerHealthController } from '../../modules/controllerModule.js';

const router = express.Router();

// real server health + problem analysis
router.get('/stats', userProtect, adminProtect, getServerHealthController);

export default router;