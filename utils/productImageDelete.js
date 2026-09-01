import cloudinary from '../config/cloudinary.js';

const deleteProductImage = async (imageUrl) => {
    try {
        if (!imageUrl) {
            throw new Error('Please provide image url')
        }
        // Extract file name without extension from cloudinary url
        const cleanUrl = imageUrl.split('?')[0];
        const segments = cleanUrl.split('/');
        const uploadIndex = segments.indexOf('upload');
        if (uploadIndex === -1) {
            throw new Error('Invalid cloudinary image url')
        }

        // Find public id segments after upload section (skip version like v1234)
        const publicIdSegments = [];
        for (let i = uploadIndex + 1; i < segments.length - 1; i++) {
            if (segments[i].startsWith('v') && /^v\d+$/.test(segments[i])) {
                // skip version segment like v123456
                i--;
                break;
            }
            /// skip version
        }
        const versionIndex = segments.findIndex((seg, i) => i > uploadIndex && /^v\d+$/.test(seg));
        const bucketStart = versionIndex !== -1 ? versionIndex + 1 : uploadIndex + 1;
        const publicId = segments.slice(bucketStart, segments.length - 1).join('/');
        if (!publicId) {
            throw new Error('Failed to extract image public id')
        }
        const deletedImage = await cloudinary.uploader.destroy(publicId);
        return deletedImage;
    } catch (error) {
        throw error;
    }
}

export default deleteProductImage;