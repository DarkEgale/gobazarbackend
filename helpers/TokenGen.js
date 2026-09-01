import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const TokenGen = async (userId, ssId) => {
    try {
        if (!userId) {
            throw new Error('User id is missing')
        }
        if (!ssId) {
            throw new Error('Session ID is missing')
        }
        const token = jwt.sign({ userId, ssId }, process.env.JWT_SECRET, { expiresIn: '15m' })
        return token;
    } catch (err) {
        console.error("Error generating token:", err);
        throw err;
    }
}

export const RefreshTokenGen = async (userId, ssId) => {
    try {
        if (!userId) {
            throw new Error('User id is missing')
        }
        if (!ssId) {
            throw new Error('Session ID is missing')
        }
        const refreshToken = jwt.sign({ userId, ssId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' })
        return refreshToken;
    } catch (err) {
        console.error("Error generating refresh token:", err);
        throw err;
    }
}

export const generateSessionId = () => {
    return crypto.randomBytes(32).toString('hex');
}
