import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { upload } from '../middleware/upload.js';
import { listVideos, uploadVideo, updateVideo, deleteVideo, linkVideoToQRs, unlinkVideoFromQRs } from '../controllers/video.controller.js';

const router = Router();

router.get('/', apiLimiter, auth, listVideos);
router.post('/upload', auth, upload.single('file'), uploadVideo);
router.put('/:id', auth, upload.single('file'), updateVideo);
router.delete('/:id', apiLimiter, auth, deleteVideo);
router.post('/:id/link', apiLimiter, auth, linkVideoToQRs);
router.post('/:id/unlink', apiLimiter, auth, unlinkVideoFromQRs);

export default router;
