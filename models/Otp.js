import mongoose from 'mongoose'

const OtpSchema = new mongoose.Schema({
    sessionId: {
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

// MongoDB TTL index — expired OTP document নিজে নিজে delete হবে
OtpSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

const OTP = mongoose.model('Otp', OtpSchema)

export default OTP;
