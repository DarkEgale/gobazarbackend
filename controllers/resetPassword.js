import { Response } from '../modules/module.js';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import ForgotPasswordOtp from '../models/forgotPasswordOtp.js';
import ATH from '../models/accestoken.js';
import RTH from '../models/refreshToken.js';

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Input validation
        if (!email || !otp || !newPassword) {
            return Response(res, false, 400, 'Email, OTP and new password are required');
        }

        if (newPassword.length < 6) {
            return Response(res, false, 400, 'Password must be at least 6 characters');
        }

        // Find OTP record
        const otpRecord = await ForgotPasswordOtp.findOne({
            email: email,
            otp: otp
        });

        if (!otpRecord) {
            return Response(res, false, 400, 'Invalid or expired OTP');
        }

        // Check if OTP has expired
        if (otpRecord.expireAt < Date.now()) {
            // Delete expired OTP
            await ForgotPasswordOtp.findByIdAndDelete(otpRecord._id);
            return Response(res, false, 400, 'OTP has expired. Please request a new one.');
        }

        // Find user
        const user = await User.findOne({ email: email });
        if (!user) {
            return Response(res, false, 404, 'User not found');
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        await user.save();

        // Password reset হলে সব পুরনো session বাতিল — চোরে পুরনো token দিয়ে ঢুকতে পারবে না
        await ATH.deleteMany({ userId: user._id });
        await RTH.deleteMany({ userId: user._id });

        // Delete OTP record after successful password reset
        await ForgotPasswordOtp.deleteMany({ email: email });

        return Response(res, true, 200, 'Password reset successfully. Please login again.');
    } catch (err) {
        console.error('Error during password reset:', err);
        return Response(res, false, 500, 'Internal Server Error');
    }
}

export default resetPassword;