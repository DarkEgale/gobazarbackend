import { OAuth2Client } from 'google-auth-library';
import User from '../models/user.model.js';

const GoogleLogin = async (credential) => {
    try {
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        if (!client) {
            throw new Error('Google OAuth2 client not initialized');
        }
        if (!credential) {
            throw new Error('Credential is missing');
        }
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({ email, name, avatar: picture, isVerified: true, authProvider: 'google', googleId: payload.sub });
        }
        return user;
    } catch (err) {
        throw err;
    }
}

export default GoogleLogin;