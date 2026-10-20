const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'ffoul5eq';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'akksys_preset';

/**
 * Uploads a video file directly to Cloudinary using an unsigned upload preset.
 * Completely bypasses Vercel/Render 4.5MB limits, timeouts, and network errors.
 *
 * @param {File} file - The video file to upload
 * @param {Function} [onProgress] - Optional upload progress callback (0-100)
 * @returns {Promise<{ secure_url: string, duration?: string, format?: string }>}
 */
export const uploadVideoToCloudinary = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve(data);
        } else {
          const errMsg = data.error?.message || `Upload failed with status ${xhr.status}`;
          reject(new Error(errMsg));
        }
      } catch {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error connecting to Cloudinary. Please check your internet connection.'));
    };

    xhr.send(formData);
  });
};
