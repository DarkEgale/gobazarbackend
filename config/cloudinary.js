import { v2 as cloudinary } from "cloudinary";
import dotenv from 'dotenv';
dotenv.config();
// Security fix: credentials are never printed to the console (log leak prevention)
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
    secure: true,
});

export default cloudinary;