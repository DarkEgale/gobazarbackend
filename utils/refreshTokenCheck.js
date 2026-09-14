import RTH from '../models/refreshToken.js';
import bcrypt from 'bcryptjs';

// Refresh token Validation
// Return values:
//   'pass'  → current token matched, normal rotation follows
//   'grace' → previous token matched (multi-tab race, see explanation below)
// All invalid cases throw a generic 'Unauthorize' — the middleware responds with 401
const RTV = async (ssId, userId, token) => {
    if (!ssId || !userId || !token) {
        throw new Error('Unauthorize');
    }
    const tokencheck = await RTH.findOne({ ssId: ssId });
    if (!tokencheck) {
        throw new Error('Unauthorize');
    }
    // Current token match → all good, rotation proceeds
    if (await bcrypt.compare(token, tokencheck.currTokenHash)) {
        return 'pass';
    }
    // Previous token match → multi-tab race:
    // When multiple tabs of the same browser refresh at once, the other tabs still send
    // the old (previous) token before the first tab's response updates the cookie.
    // This is not an attack — the session is not revoked; only a new access token
    // is issued (refresh state stays untouched).
    if (tokencheck.preTokenHash && (await bcrypt.compare(token, tokencheck.preTokenHash))) {
        return 'grace';
    }
    // Nothing matched → stolen/tampered token or the session no longer exists
    throw new Error('Unauthorize');
};

export default RTV;