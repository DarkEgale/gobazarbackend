import mongoose from "mongoose";


const forgotPasswordSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    expireAt: {
        type: Date,
        required: true
    }
})

// MongoDB TTL index — expired OTP documents are deleted automatically
forgotPasswordSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const ForgotPasswordOtp = mongoose.model('ForgotPasswordOtp', forgotPasswordSchema);
export default ForgotPasswordOtp;