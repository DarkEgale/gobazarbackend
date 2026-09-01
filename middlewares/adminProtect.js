import { Response } from '../modules/module.js';
import User from '../models/user.model.js';

const adminProtect = async (req, res, next) => {
    try {
        const user = await User.findById(req.user?.userId);
        if (!user) {
            return Response(res, false, 404, 'User not found');
        }
        if (user.role !== 'admin') {
            return Response(res, false, 403, 'Access denied: Admin only');
        }
        req.userId = user._id
        next();
    } catch (error) {
        return Response(res, false, 500, 'Internal Server Error');
    }
}

export default adminProtect;