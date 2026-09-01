import { Response } from '../modules/module.js';
import { getProductReviews, createOrUpdateReview, deleteReview, toggleHelpful } from '../modules/serviceModule.js';

// GET /api/reviews/product/:productId (public)
const getProductReviewsController = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page, limit } = req.query;
        const result = await getProductReviews(productId, page, limit);
        return Response(res, true, 200, 'Reviews fetched successfully', result);
    } catch (error) {
        console.error('[Get Product Reviews]', error.message);
        return Response(res, false, 400, error.message || 'Failed to fetch reviews');
    }
}

// POST /api/reviews/product/:productId (logged-in user)
const createReviewController = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return Response(res, false, 401, 'Unauthorized');
        }
        const { productId } = req.params;
        const { rating, title, comment } = req.body;
        const result = await createOrUpdateReview(userId, productId, { rating, title, comment });
        return Response(res, true, 201, 'Review submitted successfully', result);
    } catch (error) {
        console.error('[Create Review]', error.message);
        return Response(res, false, 400, error.message || 'Failed to submit review');
    }
}

// POST /api/reviews/:reviewId/helpful (logged-in user)
const toggleHelpfulController = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return Response(res, false, 401, 'Unauthorized');
        }
        const result = await toggleHelpful(userId, req.params.reviewId);
        return Response(res, true, 200, result.voted ? 'Marked as helpful' : 'Helpful removed', result);
    } catch (error) {
        console.error('[Toggle Helpful]', error.message);
        return Response(res, false, 400, error.message || 'Failed to update helpful');
    }
}

// DELETE /api/reviews/:reviewId (review-এর মালিক)
const deleteReviewController = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return Response(res, false, 401, 'Unauthorized');
        }
        const summary = await deleteReview(userId, req.params.reviewId);
        return Response(res, true, 200, 'Review deleted successfully', { summary });
    } catch (error) {
        console.error('[Delete Review]', error.message);
        return Response(res, false, 400, error.message || 'Failed to delete review');
    }
}

export { getProductReviewsController, createReviewController, toggleHelpfulController, deleteReviewController };