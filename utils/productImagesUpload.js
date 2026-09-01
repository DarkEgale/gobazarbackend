import cloudinary from '../config/cloudinary.js';
import sharp from 'sharp';
import streamifier from 'streamifier';

const productImagesUpload = async (files) => {
    try {
        if (!files || files.length < 1) {
            throw new Error('Please provide product images')
        }
        const images = await Promise.all(
            files.map(async (f) => {
                const optimizeBuffer = await sharp(f.buffer)
                    .resize({
                        width: 1200,
                        height: 1000,
                        fit: 'cover'
                    })
                    .webp({
                        quality: 80
                    })
                    .toBuffer();

                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'productImages',
                            transformation: [
                                {
                                    width: 1200,
                                    height: 1000,
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
                        (error, result) => {
                            if (error) {
                                return reject(error);
                            }
                            resolve(result);
                        }
                    );

                    streamifier
                        .createReadStream(optimizeBuffer)
                        .pipe(stream);
                });
            })
        );

        return images;
    } catch (error) {
        throw error;
        console.log(error)
    }
};

export default productImagesUpload;