import { Response } from '../modules/module.js';
import User from '../models/user.model.js';
import OTP from '../models/Otp.js';
import generateOTP from '../helpers/otpGen.js';
import sendEmail from '../helpers/emailSend.js';
import ForgotPasswordOtp from '../models/forgotPasswordOtp.js';
import { passwordResetEmailTemplate } from '../EmailTemplates/verificationEmailTemp.js';

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Input validation
        if (!email) {
            return Response(res, false, 400, 'Email is required');
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return Response(res, false, 404, 'User not found with this email');
        }
        // Generate OTP (পুরনো OTP গুলো বাতিল — একসাথে একাধিক valid OTP থাকলে attack surface বাড়ে)
        await ForgotPasswordOtp.deleteMany({ email: email });

        const otp = generateOTP();

        // Save OTP to database
        await ForgotPasswordOtp.create({
            email: email,
            otp: otp.toString(),
            expireAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        });

        // Send password reset email
        const emailTemplate = passwordResetEmailTemplate(otp, user.name);
        const emailResult = await sendEmail(email, 'Reset Your Password - Project GoBazar', emailTemplate);

        if (!emailResult.success) {
            console.error('Failed to send password reset email:', emailResult.error);
            return Response(res, false, 500, 'Failed to send password reset email');
        }

        return Response(res, true, 200, 'Password reset OTP sent to your email');
    } catch (err) {
        console.error('Error during forgot password:', err);
        return Response(res, false, 500, 'Internal Server Error');
    }
}

export default forgotPassword;