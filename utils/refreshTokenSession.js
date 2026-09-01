import RTH from '../models/refreshToken.js';
import bcrypt from 'bcryptjs';

const createRefreshSession = async (userId, ssId, currTokenHash, preTokenHash = null) => {
    try {
        if (!userId || !ssId || !currTokenHash) {
            throw new Error('Refresh Session creation failed: missing data');
        }
        const salt = await bcrypt.genSalt(10);
        const token = await bcrypt.hash(currTokenHash, salt);
        const hashPreToken = preTokenHash ? await bcrypt.hash(preTokenHash, salt) : null;

        // আগের pattern ছিল: findOneAndDelete → create (non-atomic)।
        // মাঝখানে create fail হলে session চিরতরে হারিয়ে যেত।
        // এখন atomic findOneAndUpdate + upsert — একই ssId এর record replace হয়,
        // কোনো ফাঁকা সময় থাকে না এবং duplicate doc জমে না।
        const refreshtoken = await RTH.findOneAndUpdate(
            { ssId: ssId },
            {
                userId: userId,
                currTokenHash: token,
                preTokenHash: hashPreToken,
                createdAt: new Date(), // TTL index যেন rotation থেকেই ৩০+ দিন গোনে
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        if (!refreshtoken) {
            throw new Error('Refresh Session creation failed');
        }
        return refreshtoken;
    } catch (error) {
        throw error
    }
}

export default createRefreshSession;