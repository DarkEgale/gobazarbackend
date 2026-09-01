import { verifyToken, Response } from '../modules/module.js';
import User from '../models/user.model.js';

const userProtect = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken
        if (!token) {
            return Response(res, false, 401, 'Unauthorized: No token provided');
        }
        const decode = verifyToken(token);
        if (!decode) {
            return Response(res, false, 401, 'Invalid Token')
        }

        const user = await User.findById(decode.userId);
        if (!user) {
            return Response(res, false, 404, 'User not found');
        }
        req.user = { userId: decode.userId, ssId: decode.ssId };
        req.preToken = token;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return Response(res, false, 401, 'TokenExpired');
        }
        // jwt.verify invalid/tamper হলে JsonWebTokenError throw করে —
        // এটা 500 না, 401 হওয়া উচিত
        if (err.name === 'JsonWebTokenError') {
            return Response(res, false, 401, 'Invalid Token');
        }
        return Response(res, false, 500, 'Internal Server Error');
    }
}

export default userProtect;