import express from "express";
import {
    createProductController,
    getAllProducts,
    getFilteredProducts,
    getSingleProduct,
    searchProductsController,
    updateProductController,
    deleteProductController
} from "../../modules/productControllerModule.js";
import userProtect from "../../middlewares/userProtect.js";
import adminProtect from "../../middlewares/adminProtect.js";
import upload from "../../middlewares/multer.js";

const router = express.Router();

// Public routes
router.get('/', getFilteredProducts);
router.get('/all', getAllProducts);
router.get('/search', searchProductsController);
router.get('/:id', getSingleProduct);

// Admin only routes (create, update, delete)
router.post('/', userProtect, adminProtect, upload.fields([
    { name: 'thumbnil', maxCount: 1 },
    { name: 'photos', maxCount: 10 }
]), createProductController);

router.put('/:id', userProtect, adminProtect, upload.fields([
    { name: 'thumbnil', maxCount: 1 },
    { name: 'photos', maxCount: 10 }
]), updateProductController);

router.delete('/:id', userProtect, adminProtect, deleteProductController);

export default router;