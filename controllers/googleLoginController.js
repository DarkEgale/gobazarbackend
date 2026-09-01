import { GoogleLogin } from '../modules/serviceModule.js';
import { Response, TokenGen, RefreshTokenGen, generateSessionId } from '../modules/module.js';
import createAccessSession from '../utils/accessTokenSession.js';
import createRefreshSession from '../utils/refreshTokenSession.js';

const googleLoginController = async (req, res) => {
    try {
        const { credential } = req.body;
        const user = await GoogleLogin(credential);

        // Generate unique session ID for this login
        const ssId = generateSessionId();

        const accessToken = await TokenGen(user._id, ssId);
        const refreshToken = await RefreshTokenGen(user._id, ssId);

        // Create sessions in database
        await createAccessSession(user._id, ssId, accessToken);
        await createRefreshSession(user._id, ssId, refreshToken);

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000,
            path: '/'
        };
        const RefreshcookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: '/'
        };
        res.cookie('accessToken', accessToken, cookieOptions);
        res.cookie('refreshToken', refreshToken, RefreshcookieOptions);

        // Return user without password
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            authProvider: user.authProvider,
            isVerified: user.isVerified
        };

        Response(res, true, 200, 'Login successful', { user: userResponse });
    } catch (err) {
        console.error('Error during Google login:', err);
        Response(res, false, 401, err.message)
    }
}
export default googleLoginController;
