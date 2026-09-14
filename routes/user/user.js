import express from 'express';
import userProtect from '../../middlewares/userProtect.js';
import adminProtect from '../../middlewares/adminProtect.js';
import upload from '../../middlewares/multer.js';
import { Response } from '../../modules/module.js';
import { getAllUsersController, updateProfileController, updateProfilePictureController, deleteUserController } from '../../modules/controllerModule.js';

const router = express.Router();

// Profile update (logged-in user)
router.patch('/profile', userProtect, updateProfileController);

// Without this, a Multer error (file > 5MB / non-image) would fall through to the
// default Express handler and return an HTML error page — meaningless for the frontend.
// Caught here and answered with a clean JSON 400 response.
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
