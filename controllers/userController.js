import { getAlluser, updateUserProfile, updateProfilePicture, deleteUserAccount } from '../modules/serviceModule.js';
import { Response } from '../modules/module.js';

// Get all users (Admin only)
const getAllUsersController = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 50;
        const result = await getAlluser(page, limit);
        return Response(res, true, 200, 'Users fetched successfully', result);
    } catch (error) {
        console.error('[Get All Users]', error.message);
        return Response(res, false, 500, error.message || 'Failed to fetch users');
    }
}

// Update logged-in user's profile (name)
const updateProfileController = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return Response(res, false, 401, 'Unauthorized');
        }
        const user = await updateUserProfile(userId, req.body);
        return Response(res, true, 200, 'Profile updated successfully', { user });
    } catch (error) {
        console.error('[Update Profile]', error.message);
        return Response(res, false, 400, error.message || 'Failed to update profile');
    }
}

// Update logged-in user's profile picture
const updateProfilePictureController = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return Response(res, false, 401, 'Unauthorized');
        }
        if (!req.file) {
            return Response(res, false, 400, 'Please select an image file');
        }
        const user = await updateProfilePicture(userId, req.file);
        return Response(res, true, 200, 'Profile picture updated successfully', { user });
    } catch (error) {
        console.error('[Update Profile Picture]', error.message);
        return Response(res, false, 400, error.message || 'Failed to update profile picture');
    }
}

// Delete a user (Admin only) — self-delete ব্লক
const deleteUserController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return Response(res, false, 400, 'User id is required');
        }
        // Admin নিজের account নিজে delete করতে পারবে না
        if (String(req.user.userId) === String(id)) {
            return Response(res, false, 400, 'You cannot delete your own account');
        }
        const deleted = await deleteUserAccount(id);
        return Response(res, true, 200, 'User deleted successfully', { user: { _id: deleted._id } });
    } catch (error) {
        console.error('[Delete User]', error.message);
        return Response(res, false, 400, error.message || 'Failed to delete user');
    }
}

export { getAllUsersController, updateProfileController, updateProfilePictureController, deleteUserController }
