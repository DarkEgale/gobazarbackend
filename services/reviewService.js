import mongoose from 'mongoose';
import REVIEW from '../models/review.model.js';
import Products from '../models/products.model.js';
import ORDER from '../models/order.model.js';

// Delivered order থাকলে এই user-এর review "Verified Purchase"
const isVerifiedPurchase = async (userId, productId) => {
    const order = await ORDER.findOne({
        userId,
        'products.productId': productId,
        orderStatus: 'deliverd'
    }).lean();
    return !!order;
};

// Product-এর avg rating + review count recompute করে product doc-এ sync করা
// (ProductCard / ProductDetails সরাসরি এই field দেখায়)
const syncProductRating = async (productId) => {
    const stats = await REVIEW.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(String(productId)) } },
        {
            $group: {
                _id: '$productId',
                avgRating: { $avg: '$rating' },
                total: { $sum: 1 }
            }
        }
    ]);
    const summary = {
        rating: stats[0] ? Math.round(stats[0].avgRating * 10) / 10 : 0,
        numReviews: stats[0]?.total || 0,
    };
    await Products.findByIdAndUpdate(productId, summary);
    return summary;
};

// নতুন review create বা নিজের আগের review update (এক user, এক product = এক review)
const createOrUpdateReview = async (userId, productId, data) => {
    if (!userId) throw new Error('User Id is required');
    if (!productId) throw new Error('Product Id is required');

    const product = await Products.findById(productId).lean();
    if (!product) throw new Error('Product not found');

    const rating = Math.round(Number(data.rating));
    if (!rating || rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
    }

    const verifiedPurchase = await isVerifiedPurchase(userId, productId);

    const review = await REVIEW.findOneAndUpdate(
        { productId, userId },
        {
            rating,
            title: (data.title || '').trim(),
            comment: (data.comment || '').trim(),
            verifiedPurchase,
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('userId', 'name avatar');

    const summary = await syncProductRating(productId);
    return { review, summary };
};

// Product-এর সব review (paginated) + rating summary
const getProductReviews = async (productId, page = 1, limit = 10) => {
    if (!productId) throw new Error('Product Id is required');

    page = Math.max(1, Number(page) || 1);
    limit = Math.min(50, Math.max(1, Number(limit) || 10));

    const productIdObj = new mongoose.Types.ObjectId(String(productId));

    const [reviews, total, stats, breakdownAgg] = await Promise.all([
        REVIEW.find({ productId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('userId', 'name avatar')
            .lean(),
        REVIEW.countDocuments({ productId }),
        REVIEW.aggregate([
            { $match: { productId: productIdObj } },
            { $group: { _id: '$productId', avgRating: { $avg: '$rating' }, total: { $sum: 1 } } }
        ]),
        REVIEW.aggregate([
            { $match: { productId: productIdObj } },
            { $group: { _id: '$rating', count: { $sum: 1 } } }
        ]),
    ]);

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    breakdownAgg.forEach((b) => { breakdown[b._id] = b.count; });

    return {
        reviews,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
        summary: {
            rating: stats[0] ? Math.round(stats[0].avgRating * 10) / 10 : 0,
            numReviews: stats[0]?.total || 0,
            breakdown,
        },
    };
};

// নিজের review delete
const deleteReview = async (userId, reviewId, isAdmin = false) => {
    if (!reviewId) throw new Error('Review Id is required');
    const review = await REVIEW.findById(reviewId);
    if (!review) throw new Error('Review not found');
    // নিজের review ছাড়া অন্য কারোটা delete করা যাবে না (admin পারবে)
    if (String(review.userId) !== String(userId) && !isAdmin) {
        throw new Error('You can only delete your own review');
    }
    await review.deleteOne();
    const summary = await syncProductRating(review.productId);
    return summary;
};

// Helpful vote toggle — একই user দুবার vote করতে পারবে না
const toggleHelpful = async (userId, reviewId) => {
    if (!userId) throw new Error('User Id is required');
    const review = await REVIEW.findById(reviewId);
    if (!review) throw new Error('Review not found');

    const alreadyVoted = review.helpfulBy.some((id) => String(id) === String(userId));

    const updated = alreadyVoted
        ? await REVIEW.findByIdAndUpdate(
            reviewId,
            { $pull: { helpfulBy: userId }, $inc: { helpful: -1 } },
            { new: true }
        ).populate('userId', 'name avatar')
        : await REVIEW.findByIdAndUpdate(
            reviewId,
            { $addToSet: { helpfulBy: userId }, $inc: { helpful: 1 } },
            { new: true }
        ).populate('userId', 'name avatar');

    return { review: updated, voted: !alreadyVoted };
};

export { createOrUpdateReview, getProductReviews, deleteReview, toggleHelpful };