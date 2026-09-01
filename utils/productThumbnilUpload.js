import cloudinary from "../config/cloudinary.js";

import sharp from 'sharp';
import streamifier from 'streamifier';


const productThumbUpload = async (file) => {
    try {
        if (!file) {
            throw new Error('Please provide a thumbnil')
        }
        const optimizeBuffer = await sharp(file.buffer).
            resize(
                {
                    width: 1200,
                    height: 800,
                    crop: 'cover'
                }
            )
            .webp(
                {
                    quality: 80
                }
            )
            .toBuffer();
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({
                folder: 'ProductThumbnil',
                transformation: [
                    {
                        width: 1200,
                        height: 800,
                        crop: 'fill'
                    }, {
                        quality: 'auto'
                    }, {
                        fetch_format: 'auto'
                    }
                ]
            }, (error, result) => {
                if (error) {
                    return reject(error)
                }
                resolve(result);
            })
            streamifier.createReadStream(optimizeBuffer).pipe(stream)
        })
    } catch (error) {
        throw error;
        console.log(error)
    }
}

export default productThumbUpload;