import { Response } from '../modules/module.js';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { TokenGen, verifyToken, RefreshTokenGen, generateSessionId, generateOTP, sendVerificationEmail } from '../modules/module.js';
import createAccessSession from '../utils/accessTokenSession.js';
import OTP from '../models/Otp.js';
import refreshTokenSession from '../utils/refreshTokenSession.js';



const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return Response(res, false, 400, 'Email and password are required');
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return Response(res, false, 401, 'Invalid email or password');
        }

        // Check if user has password (local auth)
        if (!user.password) {
            return Response(res, false, 401, 'Please login with Google');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return Response(res, false, 401, 'Invalid email or password');
        }

        // Generate session ID
        const ssId = generateSessionId();

        // Generate tokens
        const accessToken = await TokenGen(user._id, ssId);
        const refreshToken = await RefreshTokenGen(user._id, ssId);

        await createAccessSession(user._id, ssId, accessToken);
        await refreshTokenSession(user._id, ssId, refreshToken)

        // Set cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 15 * 60 * 1000,
            path: '/'
        };

        const refreshCookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: '/'
        };

        res.cookie('accessToken', accessToken, cookieOptions);
        res.cookie('refreshToken', refreshToken, refreshCookieOptions);

        // Return user without password
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            authProvider: user.authProvider,
            isVerified: user.isVerified
        };
        if (!userResponse.isVerified) {
            const otp = generateOTP();
            await OTP.create({ sessionId: ssId, otp, expireAt: new Date(Date.now() + 10 * 60 * 1000) });
            const emailResult = await sendVerificationEmail(
                user.email,
                'Email Verification',
                otp,
                user.name,
            );

            if (!emailResult.success) {
                console.error('Failed to send verification email:', emailResult.error);
            }
        }

        return Response(res, true, 200, 'Login successful', { user: userResponse });
    } catch (err) {
        console.error('Error during login:', err);
        return Response(res, false, 500, 'Internal Server Error');
    }
}

export default login;