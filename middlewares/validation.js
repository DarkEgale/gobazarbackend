// Input validation middleware

// Validate registration
export const validateRegister = (req, res, next) => {
    const { name, email, password } = req.body;

    const errors = [];

    if (!name || name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
    }

    if (!email) {
        errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Invalid email format');
    }

    if (!password) {
        errors.push('Password is required');
    } else if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: errors[0]
        });
    }

    next();
};

// Validate login
export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    const errors = [];

    if (!email) {
        errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Invalid email format');
    }

    if (!password) {
        errors.push('Password is required');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: errors[0]
        });
    }

    next();
};

// Validate Google login
export const validateGoogleLogin = (req, res, next) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({
            success: false,
            message: 'Google credential is required'
        });
    }

    next();
};

// Validate product review
export const validateReview = (req, res, next) => {
    const { rating, comment, title } = req.body;

    const errors = [];

    const r = Number(rating);
    if (!rating || Number.isNaN(r) || r < 1 || r > 5) {
        errors.push('Rating must be between 1 and 5');
    }

    if (!comment || comment.trim().length < 3) {
        errors.push('Review comment must be at least 3 characters');
    } else if (comment.trim().length > 1000) {
        errors.push('Review comment can not exceed 1000 characters');
    }

    if (title && title.trim().length > 100) {
        errors.push('Review title can not exceed 100 characters');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: errors[0]
        });
    }

    req.body.rating = r;
    next();
};