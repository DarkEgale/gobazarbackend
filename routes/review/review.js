import express from 'express';
import userProtect from '../../middlewares/userProtect.js';
import { apiRateLimiter } from '../../middlewares/rateLimiter.js';
import { validateReview } from '../../middlewares/validation.js';
import { getProductReviewsController, createReviewController, toggleHelpfulController, deleteReviewController } from '../../modules/controllerModule.js';

const router = express.Router();

// Public — যে কেউ product-এর review দেখতে পারবে
router.get('/product/:productId', getProductReviewsController);

// Logged-in user — review create/update, helpful vote, delete
router.post('/product/:productId', userProtect, apiRateLimiter, validateReview, createReviewController);
router.post('/:reviewId/helpful', userProtect, toggleHelpfulController);
router.delete('/:reviewId', userProtect, deleteReviewController);

export default router;