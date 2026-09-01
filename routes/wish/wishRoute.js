import userProtect from "../../middlewares/userProtect.js";
import express from 'express';
import { createWish, getWishList } from '../../modules/controllerModule.js';



const router = express.Router();

router.post('/add-wish', userProtect, createWish)
router.get('/get-wish', userProtect, getWishList)


export default router;