import RTH from '../models/refreshToken.js';
import bcrypt from 'bcryptjs';

// Refresh token Validation
// Return values:
//   'pass'  → current token মিলেছে, normal rotation হবে
//   'grace' → previous token মিলেছে (multi-tab race, নিচের ব্যাখ্যা দেখুন)
// সব invalid ক্ষেত্রে generic 'Unauthorize' throw করা হয় — middleware 401 পাঠাবে
const RTV = async (ssId, userId, token) => {
    if (!ssId || !userId || !token) {
        throw new Error('Unauthorize');
    }
    const tokencheck = await RTH.findOne({ ssId: ssId });
    if (!tokencheck) {
        throw new Error('Unauthorize');
    }
    // Current token match → সব ঠিক আছে, rotation হবে
    if (await bcrypt.compare(token, tokencheck.currTokenHash)) {
        return 'pass';
    }
    // Previous token match → multi-tab race:
    // একই browser-এর একাধিক tab একসাথে refresh করলে, প্রথম tab এর response
    // cookie update করার আগেই বাকি tab গুলো পুরনো (previous) token দিয়েই
    // request পাঠায়। এটা attack না — তাই session revoke করা হবে না,
    // শুধু নতুন access token দেওয়া হবে (refresh state অপরিবর্তিত থাকবে)।
    if (tokencheck.preTokenHash && (await bcrypt.compare(token, tokencheck.preTokenHash))) {
        return 'grace';
    }
    // কোনোটাই মিলল না → token চুরি/tamper করা বা session আর নেই
    throw new Error('Unauthorize');
};

export default RTV;