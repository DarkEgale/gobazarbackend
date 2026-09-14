import express from 'express';
import userProtect from '../../middlewares/userProtect.js';
import adminProtect from '../../middlewares/adminProtect.js';
import { createReturnRequestController, getMyReturnsController, getAllReturnsController, updateReturnStatusController } from '../../modules/controllerModule.js';


const router = express.Router();


router.post('/create', userProtect, createReturnRequestController);
router.get('/my-returns', userProtect, getMyReturnsController);
router.get('/all', userProtect, adminProtect, getAllReturnsController);
router.patch('/status', userProtect, adminProtect, updateReturnStatusController);


export default router;