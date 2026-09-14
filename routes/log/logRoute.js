import express from 'express';
import userProtect from '../../middlewares/userProtect.js';
import adminProtect from '../../middlewares/adminProtect.js';
import { getLogsController, clearLogsController } from '../../modules/controllerModule.js';

const router = express.Router();

router.get('/', userProtect, adminProtect, getLogsController);
router.delete('/clear', userProtect, adminProtect, clearLogsController);

export default router;