import multer from "multer";

// Security: memoryStorage হলেও file size limit + image-only filter না থাকলে
// যে কেউ বিশাল ফাইল পাঠিয়ে server-এর RAM শেষ করে দিতে পারে (DoS)
const storage = multer.memoryStorage();

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB per file
        files: 11,                 // 1 thumbnail + 10 photos
    },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
            return cb(new Error('Only image files are allowed (jpg, png, webp, gif)'));
        }
        cb(null, true);
    },
})

export default upload;