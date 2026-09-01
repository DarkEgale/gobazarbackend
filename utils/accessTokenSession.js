import ATH from "../models/accestoken.js";
import bcrypt from 'bcryptjs';

const createAccessSession = async (userId, ssId, currToken, preToken = null) => {
    try {
        if (!userId) {
            throw new Error('User Id is missing')
        }
        if (!ssId) {
            throw new Error('SSID is missing')
        }
        if (!currToken) {
            throw new Error("Token is missing")
        }
        const salt = await bcrypt.genSalt(10);
        const hashToken = await bcrypt.hash(currToken, salt)
        const hashPreToken = preToken ? await bcrypt.hash(preToken, salt) : null

        // আগে প্রতিটা refresh এ নতুন doc create হতো, পুরনোটা থেকে যেত —
        // DB-তে একই ssId এর অগণিত doc জমত। এখন atomic upsert দিয়ে
        // একই ssId এর record replace হয়।
        const result = await ATH.findOneAndUpdate(
            { ssId: ssId },
            {
                userId: userId,
                currTokenHash: hashToken,
                preTokenHash: hashPreToken,
                createdAt: new Date() // TTL index যেন শেষ rotation থেকেই গোনা হয়
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        return result;
    } catch (error) {
        throw error;
    }
}

export default createAccessSession;
