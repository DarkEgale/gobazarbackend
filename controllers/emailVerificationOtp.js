import { Response } from '../modules/module.js';
import User from '../models/user.model.js';
import OTP from '../models/Otp.js';
import generateOTP from '../helpers/otpGen.js';
import sendEmail from '../helpers/emailSend.js';

const resendEmailVerificationOtp = async (req, res) => {
	try {
		const { userId, ssId } = req.user;
		const user = await User.findById(userId);

		if (!user) {
			return Response(res, false, 404, 'User not found');
		}

		if (user.isVerified) {
			return Response(res, false, 400, 'Email is already verified');
		}

		await OTP.deleteMany({ sessionId: ssId });

		const otp = generateOTP();
		await OTP.create({
			sessionId: ssId,
			otp: otp.toString(),
			expireAt: new Date(Date.now() + 10 * 60 * 1000),
		});

		const emailResult = await sendEmail(
			user.email,
			'Verify Your Email GoBazar',
			otp,
			user.name,
		);

		if (!emailResult.success) {
			await OTP.deleteMany({ sessionId: ssId });
			return Response(res, false, 500, 'Failed to send verification email');
		}

		return Response(res, true, 200, 'Verification OTP resent successfully');
	} catch (err) {
		console.error('Error resending email verification OTP:', err);
		return Response(res, false, 500, 'Internal Server Error');
	}
};

export default resendEmailVerificationOtp;
