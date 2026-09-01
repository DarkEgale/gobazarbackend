// Simple in-memory rate limiter
const rateLimit = (windowMs = 15 * 60 * 1000, max = 5) => {
    const requests = new Map();

    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();

        if (!requests.has(key)) {
            requests.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }

        const requestData = requests.get(key);

        if (now > requestData.resetTime) {
            requests.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }

        if (requestData.count >= max) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later'
            });
        }

        requestData.count++;
        next();
    };
};

// Auth rate limiter - stricter for login/register
export const authRateLimiter = rateLimit(15 * 60 * 1000, 5); // 5 requests per 15 minutes

// General API rate limiter
export const apiRateLimiter = rateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes