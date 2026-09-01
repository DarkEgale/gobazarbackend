import jwt from 'jsonwebtoken';

const verifyToken = (token) => {
    try {
        if (!token) {
            throw new Error('Token is missing');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        return decoded;
    } catch (err) {
        console.error('Error verifying token:', err);
        throw err;
    }
};

export default verifyToken;