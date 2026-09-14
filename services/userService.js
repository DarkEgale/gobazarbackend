import User from '../models/user.model.js';
import ORDER from '../models/order.model.js';
import WishList from '../models/wisthLisht.model.js';
import { uploadImage, deleteImage } from '../utils/ProfileUpload.js';

const updateProfilePicture = async (userId, file) => {
    if (!file) {
        throw new Error('File are required')
    }
    if (!userId) {
        throw new Error('User Id is required')
    }
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('user not found')
    }
    try {
        const upload = await uploadImage(file)
        // the avatar field was previously misspelled 'avtar' — now matches the schema
        const updateUser = await User.findByIdAndUpdate(
            userId,
            { avatar: upload.secure_url, avatarPublicId: upload.public_id },
            { new: true, runValidators: true }
        ).select('-password -googleId');
        // Delete the old profile image from Cloudinary —
        // non-critical: even if the delete fails, the new avatar is already set,
        // so the whole request should not fail (logged for orphan cleanup)
        if (user.avatarPublicId) {
            await deleteImage(user.avatarPublicId).catch((err) => {
                console.error('[Avatar cleanup] Failed to delete old image:', err?.message || err);
            });
        }
        return updateUser;
    } catch (error) {
        throw error;
    }
}

// Update profile data (name only — email changes are disallowed for security reasons)
const updateUserProfile = async (userId, data) => {
    if (!userId) {
        throw new Error('User Id is required')
    }
    const update = {};
    if (data.name !== undefined) {
        if (typeof data.name !== 'string' || data.name.trim().length < 2) {
            throw new Error('Name must be at least 2 characters');
        }
        update.name = data.name.trim();
    }
    if (Object.keys(update).length === 0) {
        throw new Error('No valid fields to update');
    }
    const user = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true })
        .select('-password -googleId');
    if (!user) {
        throw new Error('User not found');
    }
    return user;
}


// For Admin get all user (with per-user order count and total spent)

const getAlluser = async (page = 1, limit = 50) => {
    try {
        page = Math.max(1, Number(page));
        limit = Math.min(100, Math.max(1, Number(limit)));

        const totalUsers = await User.countDocuments({});
        const totalPages = Math.ceil(totalUsers / limit) || 1;

        const users = await User.find({})
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Aggregate order count & total spent per user
        const orderStats = await ORDER.aggregate([
            {
                $group: {
                    _id: '$userId',
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: '$totalAmount' }
                }
            }
        ]);

        const statsMap = new Map(
            orderStats.map((s) => [String(s._id), s])
        );

        const usersWithStats = users.map((user) => {
            const stat = statsMap.get(String(user._id));
            return {
                ...user,
                orders: stat?.orderCount || 0,
                totalSpent: stat?.totalSpent || 0
            };
        });

        return { users: usersWithStats, totalUsers, totalPages, page, limit };
    } catch (error) {
        throw error;
    }
}
// Admin delete user account (also cleans up the user's orders and wishlist)
const deleteUserAccount = async (userId) => {
    try {
        const deleted = await User.findByIdAndDelete(userId)
        if (!deleted) {
            throw new Error('Falied to delete user')
        }
        // remove all of the user's related data
        await WishList.deleteMany({ userId });
        await ORDER.deleteMany({ userId });
        return deleted;
    } catch (error) {
        throw error
    }
}

export { getAlluser, updateUserProfile, updateProfilePicture, deleteUserAccount };
