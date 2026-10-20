const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qkkqqfxirycitxgeywos.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_CMgx-ximik_sshDKadnD7A_gzoz-A2K';

/**
 * Uploads a video file directly to the Supabase "videos" storage bucket.
 * This completely bypasses backend/Vercel payload limits and network timeouts.
 *
 * @param {File} file - The file to upload
 * @param {Function} [onProgress] - Optional upload progress callback
 * @returns {Promise<string>} The public URL of the uploaded video
 */
export const uploadVideoToSupabase = async (file, onProgress) => {
  const fileExt = file.name.split('.').pop() || 'mp4';
  const cleanName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  const fileName = `${Date.now()}_${cleanName}.${fileExt}`;
  const uploadEndpoint = `${SUPABASE_URL}/storage/v1/object/videos/${encodeURIComponent(fileName)}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadEndpoint, true);

    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Return public accessible URL
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/videos/${encodeURIComponent(fileName)}`;
        resolve(publicUrl);
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.message || errData.error || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during Supabase upload. Check your internet connection.'));
    };

    xhr.send(file);
  });
};
