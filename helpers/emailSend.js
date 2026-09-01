import { Resend } from 'resend';
import dotenv from 'dotenv';
import { verificationEmailTemplate } from '../EmailTemplates/verificationEmailTemp.js';
dotenv.config();
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, otp, name = 'there') => {
    try {
        const data = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to,
            subject: subject,
            html: verificationEmailTemplate(otp, name),
        });
        return { success: true, data };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }
};

export default sendEmail; 


