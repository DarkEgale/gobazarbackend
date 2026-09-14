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

        // Previously every refresh created a new doc and left the old one behind —
        // countless docs with the same ssId piled up in the DB. Now an atomic upsert
        // replaces the record for the same ssId.
        const result = await ATH.findOneAndUpdate(
            { ssId: ssId },
            {
                userId: userId,
                currTokenHash: hashToken,
                preTokenHash: hashPreToken,
                createdAt: new Date() // TTL index counts from the latest rotation
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        return result;
    } catch (error) {
        throw error;
    }
}

export default createAccessSession;
