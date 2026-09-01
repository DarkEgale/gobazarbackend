import express from "express";
import { googleLoginController, logout, newToken, me, register, login, verifyEmail, resendEmailVerificationOtp, forgotPassword, resetPassword } from "../../modules/controllerModule.js";
import refreshTokenCheck from "../../middlewares/refreshTokenCheck.js";
import userProtect from "../../middlewares/userProtect.js";
import { authRateLimiter } from "../../middlewares/rateLimiter.js";
import { validateRegister, validateLogin, validateGoogleLogin } from "../../middlewares/validation.js";
import verifyForgotPasswordOtp from "../../controllers/forgotPassOtpVerify.js";

const router = express.Router();

// Current logged-in user (access token theke user data restore)
// NOTE: authRateLimiter ekhane use kora jay na — app load e /me call hoy,
// ar eta login er sathe same 5-request/15min bucket share kore. Fole
// 2-3 bar page reload korlei bucket shesh hoye jay ar login e 429 ashe.
// /me read-only session restore, tai lighter apiRateLimiter use kora hocche.
router.get('/me', userProtect, me);

// Google OAuth
router.post('/google/login', authRateLimiter, validateGoogleLogin, googleLoginController);

// Manual authentication
router.post('/register', authRateLimiter, validateRegister, register);
router.post('/login', authRateLimiter, validateLogin, login);

// Email verification
router.post('/verify-email', authRateLimiter, userProtect, verifyEmail);
router.post('/resend-email-otp', authRateLimiter, userProtect, resendEmailVerificationOtp);

// Password reset
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.post('/verify-forgot-password-otp', authRateLimiter, verifyForgotPasswordOtp);
// Token management
router.post('/refresh-token', refreshTokenCheck, newToken);
// Logout-এ access token লাগে না — refresh token দিয়েই session identify হয়।
// আগে userProtect ছিল, ফলে access token expire (১৫ মিনিট) হলে logout ব্যর্থ হতো।
router.post('/logout', refreshTokenCheck, logout);

export default router;
