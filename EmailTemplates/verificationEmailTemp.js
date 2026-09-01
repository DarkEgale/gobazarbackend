export const verificationEmailTemplate = (otp, name) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding: 20px 0;">
                <h1 style="color: #4f46e5; margin: 0;">Project GoBazar</h1>
            </div>
            
            <div style="padding: 20px 0;">
                <h2 style="color: #333333; margin-top: 0;">Verify Your Email Address</h2>
                
                <p style="color: #666666; line-height: 1.6;">Hello ${name},</p>
                
                <p style="color: #666666; line-height: 1.6;">
                    Thank you for registering with Project GoBazar. To complete your registration, please verify your email address by entering the OTP below:
                </p>
                
                <div style="background-color: #f4f4f4; border: 2px dashed #4f46e5; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                    <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;">Your Verification OTP</p>
                    <h1 style="color: #4f46e5; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
                </div>
                
                <p style="color: #666666; line-height: 1.6;">
                    This OTP will expire in <strong>10 minutes</strong>. Please do not share this code with anyone.
                </p>
                
                <p style="color: #666666; line-height: 1.6;">
                    If you did not create an account with us, please ignore this email.
                </p>
            </div>
            
            <div style="border-top: 1px solid #eeeeee; padding-top: 20px; text-align: center; color: #999999; font-size: 12px;">
                <p style="margin: 0;">© 2024 Project GoBazar. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

export const passwordResetEmailTemplate = (otp, name) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding: 20px 0;">
                <h1 style="color: #4f46e5; margin: 0;">Project GoBazar</h1>
            </div>
            
            <div style="padding: 20px 0;">
                <h2 style="color: #333333; margin-top: 0;">Reset Your Password</h2>
                
                <p style="color: #666666; line-height: 1.6;">Hello ${name},</p>
                
                <p style="color: #666666; line-height: 1.6;">
                    We received a request to reset your password. Use the OTP below to proceed:
                </p>
                
                <div style="background-color: #f4f4f4; border: 2px dashed #4f46e5; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                    <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;">Your Password Reset OTP</p>
                    <h1 style="color: #4f46e5; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
                </div>
                
                <p style="color: #666666; line-height: 1.6;">
                    This OTP will expire in <strong>10 minutes</strong>. Please do not share this code with anyone.
                </p>
                
                <p style="color: #666666; line-height: 1.6;">
                    If you did not request a password reset, please ignore this email or contact support if you have concerns.
                </p>
            </div>
            
            <div style="border-top: 1px solid #eeeeee; padding-top: 20px; text-align: center; color: #999999; font-size: 12px;">
                <p style="margin: 0;">© 2024 Project GoBazar. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};