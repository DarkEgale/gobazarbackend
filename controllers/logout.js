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
        // (RTH delete না করলে logout-এর পরেও refresh token ৩০ দিন কাজ করত)
        await ATH.findOneAndDelete({ ssId, userId });
        await RTH.findOneAndDelete({ ssId, userId });

        // Clear cookies
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            path: '/'
        });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            path: '/'
        });

        return Response(res, true, 200, 'Logout successful');
    } catch (err) {
        console.error('Error during logout:', err);
        return Response(res, false, 500, 'Internal Server Error');
    }
}

export default logout;