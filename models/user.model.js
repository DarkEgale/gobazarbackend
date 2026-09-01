import mongoose from 'mongoose';
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            default: null,
        },

        googleId: {
            type: String,
            default: null,
            sparse: true,
        },

        avatar: {
            type: String,
            default: null,
        },

        avatarPublicId: {
            type: String,
            default: null,
        },

        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);
export default User;