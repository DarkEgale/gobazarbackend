import { v2 as cloudinary } from "cloudinary";
import dotenv from 'dotenv';
dotenv.config();
// Security fix: credentials আর console-এ print করা হয় না (log leak)
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
    secure: true,
});

export default cloudinary;