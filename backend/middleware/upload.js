import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ffoul5eq',
  api_key: process.env.CLOUDINARY_API_KEY || '799268813852669',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'WjyErUQu5BaX7Z05uWWHZAb6k_I',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype && file.mimetype.startsWith('video');
    return {
      folder: 'akksys_uploads',
      resource_type: isVideo ? 'video' : 'auto',
      allowed_formats: isVideo ? ['mp4', 'mov', 'webm', 'mkv', 'avi'] : ['jpg', 'png', 'jpeg', 'webp', 'svg'],
    };
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
});
