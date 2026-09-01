import express from 'express';
import userProtect from '../../middlewares/userProtect.js';
import adminProtect from '../../middlewares/adminProtect.js';
import { createOrderController, getOrdersController, getAllOrdersController, getOrderByIdController } from '../../modules/controllerModule.js';


const router = express.Router();


router.post('/create', userProtect, createOrderController);
router.get('/my-orders', userProtect, getOrdersController);
router.get('/details/:id', userProtect, getOrderByIdController);
router.get('/all', userProtect, adminProtect, getAllOrdersController);


export default router;