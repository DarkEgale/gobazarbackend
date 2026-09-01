import express from 'express';
import userProtect from '../../middlewares/userProtect.js';
import adminProtect from '../../middlewares/adminProtect.js';
import upload from '../../middlewares/multer.js';
import { Response } from '../../modules/module.js';
import { getAllUsersController, updateProfileController, updateProfilePictureController, deleteUserController } from '../../modules/controllerModule.js';

const router = express.Router();

// Profile update (logged-in user)
router.patch('/profile', userProtect, updateProfileController);

// Multer error (file > 5MB / non-image) হলে Express default handler-এ গেলে
// HTML error page ফেরত যেত — frontend-এ অর্থহীন message দেখাত।
// এখানে ধরে clean JSON 400 response দেওয়া হচ্ছে।
router.post('/profile/avatar', userProtect, (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
        if (err) {
            const message = err.code === 'LIMIT_FILE_SIZE'
                ? 'Image is too large (maximum 5 MB)'
                : err.message || 'Image upload failed';
            return Response(res, false, 400, message);
        }
        next();
    });
}, updateProfilePictureController);

// Admin only routes
router.get('/all', userProtect, adminProtect, getAllUsersController);
router.delete('/:id', userProtect, adminProtect, deleteUserController);

export default router;
