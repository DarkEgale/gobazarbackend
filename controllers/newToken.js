import { TokenGen, RefreshTokenGen, Response } from '../modules/module.js';
import createAccessSession from '../utils/accessTokenSession.js';
import createRefreshSession from '../utils/refreshTokenSession.js';


const newToken = async (req, res) => {
    try {
        const { userId, ssId } = req.user;
        const preToken = req.preToken || null;
        // 'grace' = the request came with the previous refresh token (multi-tab race) —
        // in this case only a new access token is issued and the refresh state is left untouched
        const graceRefresh = req.graceRefresh === true;

        if (!userId || !ssId) {
            return Response(res, false, 400, 'User id or session id is missing');
        }

        // Generate new access token with same ssId
        const newAccessToken = await TokenGen(userId, ssId);

        // Update access session: shift current to previous, new to current
        // (the previous access token is already in the cookie — it will be stored as previous)
        const oldAccessToken = req.cookies?.accessToken || null;
        await createAccessSession(userId, ssId, newAccessToken, oldAccessToken);

        let newRefreshToken = null;
        if (!graceRefresh) {
            // Normal rotation: the old refresh token is stored as previous,
            // the new one becomes current (atomic upsert — no separate delete needed)
            newRefreshToken = await RefreshTokenGen(userId, ssId);
            await createRefreshSession(userId, ssId, newRefreshToken, preToken);
        }
        // In grace mode nothing changes in the DB — tabs still running with old tokens
        // can rotate through the normal path on their next attempt

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000,
            path: '/'
        };

        res.cookie('accessToken', newAccessToken, cookieOptions);

        if (!graceRefresh) {
            const rcookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: '/'
            };
            res.cookie('refreshToken', newRefreshToken, rcookieOptions);
        }
        // In grace mode the refresh cookie is not set again — the browser
        // already holds a valid refresh token

        return Response(res, true, 200, 'Token generated successfully');
    } catch (err) {
        console.error('Error generating new token:', err);
        return Response(res, false, 500, 'Internal Server Error');
    }
}

export default newToken;
