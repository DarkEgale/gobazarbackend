import cloudinary from "../config/cloudinary.js";
import sharp from 'sharp'
import streamifier from "streamifier";
const uploadImage = async (file) => {

    const optimizeBuffer = await sharp(file.buffer)
        .resize(
            {
                width: 500,
                height: 500,
                fit: 'cover'
            }
        )
        .webp({
            quality: 80
        })
        .toBuffer();
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
            folder: 'User',
            transformation: [
                {
                    width: 500,
                    height: 500,
                    crop: 'fill'
                },
                {
                    quality: 'auto'
                },
                {
                    fetch_format: 'auto'
                }
            ]
        },
            // Cloudinary callback signature: (error, result) —
            // আগে (result, error) লেখা ছিল, ফলে upload সফল হলেও result object-টাই
            // error হিসেবে reject হতো এবং প্রতিবার avatar upload fail করত
            (error, result) => {
                if (error) {
                    return reject(error)
                }
                resolve(result)
            })
        streamifier.createReadStream(optimizeBuffer).pipe(stream)
    })
}


const deleteImage = async (publicId) => {
    try {
        if (!publicId) {
            throw new Error('Please provide image Public Id')
        }
        const deletedImage = await cloudinary.uploader.destroy(publicId)
        return deletedImage;
    } catch (error) {
        throw error
    }
}

export { uploadImage, deleteImage }