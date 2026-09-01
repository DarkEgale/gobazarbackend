import { Response } from '../modules/module.js';
import ForgotPasswordOtp from '../models/forgotPasswordOtp.js';


const verifyForgotPasswordOtp = async (req, res) => {
    try {
        const { resetotp, email } = req.body;
        const otpRecord = await ForgotPasswordOtp.findOne({ otp: resetotp, email: email });
        if (!otpRecord) {
            return Response(res, false, 400, 'Invalid OTP or email');
        }
        // Expiry check (আগে ছিল না — মেয়াদোত্তীর্ণ OTP-ও pass হয়ে যেত)
        if (otpRecord.expireAt < Date.now()) {
            await ForgotPasswordOtp.findByIdAndDelete(otpRecord._id);
            return Response(res, false, 400, 'OTP has expired. Please request a new one.');
        }
        return Response(res, true, 200, 'OTP verified successfully');
    } catch (err) {
        console.error('Error during forgot password OTP verification:', err);
        return Response(res, false, 500, 'Internal Server Error');
    }
}

export default verifyForgotPasswordOtp;