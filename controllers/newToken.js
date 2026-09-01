import { TokenGen, RefreshTokenGen, Response } from '../modules/module.js';
import createAccessSession from '../utils/accessTokenSession.js';
import createRefreshSession from '../utils/refreshTokenSession.js';


const newToken = async (req, res) => {
    try {
        const { userId, ssId } = req.user;
        const preToken = req.preToken || null;
        // 'grace' = previous refresh token দিয়ে এসেছে (multi-tab race) —
        // এই ক্ষেত্রে শুধু নতুন access token দেওয়া হবে, refresh state ধরা হবে না
        const graceRefresh = req.graceRefresh === true;

        if (!userId || !ssId) {
            return Response(res, false, 400, 'User id or session id is missing');
        }

        // Generate new access token with same ssId
        const newAccessToken = await TokenGen(userId, ssId);

        // Update access session: shift current to previous, new to current
        // (আগের access token cookie-তেই আছে — সেটাই previous হিসেবে store হবে)
        const oldAccessToken = req.cookies?.accessToken || null;
        await createAccessSession(userId, ssId, newAccessToken, oldAccessToken);

        let newRefreshToken = null;
        if (!graceRefresh) {
            // Normal rotation: পুরনো refresh token previous হিসেবে store হবে,
            // নতুনটা current হবে (atomic upsert — আলাদা delete লাগে না)
            newRefreshToken = await RefreshTokenGen(userId, ssId);
            await createRefreshSession(userId, ssId, newRefreshToken, preToken);
        }
        // grace হলে DB-তে কিছু বদলায় না — যারা পুরনো token নিয়ে দৌড়াচ্ছিল
        // তারাও পরের বার normal path দিয়ে rotate করতে পারবে

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000,
            path: '/'
        };

        res.cookie('accessToken', newAccessToken, cookieOptions);

        if (!graceRefresh) {
            const rcookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: '/'
            };
            res.cookie('refreshToken', newRefreshToken, rcookieOptions);
        }
        // grace হলে refresh cookie নতুন করে set করা হয় না — browser-এ
        // আগের থেকেই একটা valid refresh token আছে

        return Response(res, true, 200, 'Token generated successfully');
    } catch (err) {
        console.error('Error generating new token:', err);
        return Response(res, false, 500, 'Internal Server Error');
    }
}

export default newToken;
