import { verifyToken, Response } from '../modules/module.js';
import jwt from 'jsonwebtoken'
import RTV from '../utils/refreshTokenCheck.js';


const refreshTokenCheck = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) {
            return Response(res, false, 401, 'Unauthorized: No refresh token provided');
        }
        const decode = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        if (!decode) {
            return Response(res, false, 401, 'Unauthorized: Invalid refresh token');
        }
        const ssId = decode.ssId;
        const userId = decode.userId;
        const check = await RTV(ssId, userId, token);
        req.user = { userId, ssId };
        req.preToken = token;
        // 'grace' হলে previous token দিয়ে এসেছে (multi-tab race) —
        // newToken controller এই flag দেখে refresh rotation skip করবে
        req.graceRefresh = check === 'grace';
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return Response(res, false, 401, 'RefreshTokenExpired');
        }
        if (err.message === 'Unauthorize') {
            return Response(res, false, 401, 'Unauthorized: Invalid refresh token');
        }
        console.error('[Refresh token error:]', err.message)
        return Response(res, false, 500, 'Internal Server Error');
    }
}

export default refreshTokenCheck;