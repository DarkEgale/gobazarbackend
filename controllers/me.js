import { Response } from '../modules/module.js';
import User from '../models/user.model.js';

// GET /auth/me - access token theke current logged-in user er data return kore
const me = async (req, res) => {
    try {
        const { userId } = req.user; // userProtect middleware theke ashe

        if (!userId) {
            return Response(res, false, 401, 'Unauthorized: User id missing');
        }

        const user = await User.findById(userId).select('-password -googleId');

        if (!user) {
            return Response(res, false, 404, 'User not found');
        }

        return Response(res, true, 200, 'User fetched successfully', { user });
    } catch (err) {
        console.error('Error fetching current user:', err);
        return Response(res, false, 500, 'Internal Server Error');
    }
}

export default me;