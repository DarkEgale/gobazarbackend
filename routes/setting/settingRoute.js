import express from 'express';
import userProtect from '../../middlewares/userProtect.js';
import adminProtect from '../../middlewares/adminProtect.js';
import { getSettingsController, updateSettingsController } from '../../modules/controllerModule.js';

const router = express.Router();

// any logged-in user can read the store settings
router.get('/', userProtect, getSettingsController);
// admin only can update
router.put('/', userProtect, adminProtect, updateSettingsController);

export default router;