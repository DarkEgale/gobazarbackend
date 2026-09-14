import { Response } from '../modules/module.js';
import ATH from '../models/accestoken.js';
import RTH from '../models/refreshToken.js';

const logout = async (req, res) => {
    try {
        const { ssId, userId } = req.user;

        if (!ssId || !userId) {
            return Response(res, false, 400, 'Session information missing');
        }

        // Delete the access + refresh sessions from database
        // (without deleting the RTH entry, the refresh token would keep working for 30 days after logout)
        await ATH.findOneAndDelete({ ssId, userId });
        await RTH.findOneAndDelete({ ssId, userId });

        // Clear cookies
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        });

        return Response(res, true, 200, 'Logout successful');
    } catch (err) {
        console.error('Error during logout:', err);
        return Response(res, false, 500, 'Internal Server Error');
    }
}

export default logout;