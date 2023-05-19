import express from 'express';
import { isAuth } from '../Middlewares/Auth.js';
import { body } from 'express-validator';
import { uploadAvatar, uploadFileC, uploadThumbnail } from '../Controllers/Asset.js';

const router = express.Router();

router.post('/upload-avatar', uploadAvatar);

router.post('/upload-thumbnail', isAuth, uploadThumbnail);

router.post('/upload-file', isAuth, uploadFileC);

export default router;
