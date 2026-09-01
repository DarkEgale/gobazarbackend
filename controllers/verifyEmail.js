import { Response } from '../modules/module.js';
import User from '../models/user.model.js';
import OTP from '../models/Otp.js';

const verifyEmail = async (req, res) => {
    try {
        const { otp } = req.body;
        if (!otp) {
            return Response(res, false, 400, 'OTP is required');
        }
        const ssId = req.user.ssId;
        const userId = req.user.userId;

        const otpRecord = await OTP.findOne({
            sessionId: ssId,
            otp: otp
        });

        if (!otpRecord) {
            return Response(res, false, 400, 'Invalid or expired OTP');
        }

        if (otpRecord.expireAt < Date.now()) {
            await OTP.findByIdAndDelete(otpRecord._id);
            return Response(res, false, 400, 'OTP has expired. Please request a new one.');
        }
        const user = await User.findById(userId);
        if (!user) {
            return Response(res, false, 404, 'User not found');
        }

        if (user.isVerified) {
            await OTP.findByIdAndDelete(otpRecord._id);
            return Response(res, false, 400, 'Email is already verified');
        }

        // Update user as verified
        user.isVerified = true;
        await user.save();

        // Delete OTP record after successful verification
        await OTP.findByIdAndDelete(otpRecord._id);

        // Return user without password
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            authProvider: user.authProvider,
            isVerified: user.isVerified
        };

        return Response(res, true, 200, 'Email verified successfully', { user: userResponse });
    } catch (err) {
        console.error('Error during email verification:', err);
        return Response(res, false, 500, 'Internal Server Error');
    }
}

export default verifyEmail;