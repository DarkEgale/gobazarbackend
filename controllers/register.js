import { Response } from '../modules/module.js';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { TokenGen, RefreshTokenGen, generateSessionId } from '../modules/module.js';
import createAccessSession from '../utils/accessTokenSession.js';
import createRefreshSession from '../utils/refreshTokenSession.js';
import OTP from '../models/Otp.js';
import generateOTP from '../helpers/otpGen.js';
import sendEmail from '../helpers/emailSend.js';

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Input validation
        if (!name || !email || !password) {
            return Response(res, false, 400, 'All fields are required');
        }

        if (password.length < 6) {
            return Response(res, false, 400, 'Password must be at least 6 characters');
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return Response(res, false, 400, 'User already exists with this email');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate session ID
        const ssId = generateSessionId();

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            authProvider: 'local',
            isVerified: false
        });

        // Generate OTP
        const otp = generateOTP();

        // Save OTP to database
        await OTP.create({
            sessionId: ssId,
            otp: otp.toString(),
            expireAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        });

        // Send verification email
        const emailResult = await sendEmail(email, 'Verify Your Email GoBazar', otp, name);

        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
        }

        // Generate tokens
        const accessToken = await TokenGen(user._id, ssId);
        const refreshToken = await RefreshTokenGen(user._id, ssId);

        // Create sessions
        await createAccessSession(user._id, ssId, accessToken);
        await createRefreshSession(user._id, ssId, refreshToken);

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

        // Return user without password (ssId client-এ leak করা হয় না — এটা cookie-র JWT-তেই থাকে)
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            authProvider: user.authProvider,
            isVerified: user.isVerified
        };

        return Response(res, true, 201, 'Registration successful. Please verify your email.', { user: userResponse });
    } catch (err) {
        console.error('Error during registration:', err);
        return Response(res, false, 500, 'Internal Server Error');
    }
}

export default register;
