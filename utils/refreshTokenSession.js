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

        // Previous pattern: findOneAndDelete → create (non-atomic).
        // If create failed in between, the session was lost forever.
        // Now atomic findOneAndUpdate + upsert — the record for the same ssId is replaced,
        // with no gap in between and no duplicate docs piling up.
        const refreshtoken = await RTH.findOneAndUpdate(
            { ssId: ssId },
            {
                userId: userId,
                currTokenHash: token,
                preTokenHash: hashPreToken,
                createdAt: new Date(), // TTL index counts the 30+ day lifetime from the rotation
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