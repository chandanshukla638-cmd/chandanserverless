import { db } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const listVideos = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT v.*,
        (SELECT COUNT(DISTINCT c.qr_id) FROM campaign_versions cv
         JOIN campaigns c ON cv.campaign_id = c.id
         WHERE cv.video_url = v.video_url) as linked_qrs
       FROM videos v ORDER BY v.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const uploadVideo = async (req, res, next) => {
  try {
    const { name, video_url, video_type, duration, size } = req.body;
    let finalVideoUrl = video_url;
    let finalSize = size;
    let finalType = video_type || 'mp4';

    if (req.file) {
      // If using Cloudinary, req.file.path contains the URL. If local, it might not.
      finalVideoUrl = req.file.path || `/uploads/${req.file.filename}`;
      finalSize = req.file.size ? (req.file.size / (1024 * 1024)).toFixed(1) + ' MB' : 'Unknown Size';
      finalType = req.file.mimetype ? req.file.mimetype.split('/')[1] : 'mp4';
    }

    const result = await db.query(
      'INSERT INTO videos (name, video_url, video_type, duration, size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, finalVideoUrl, finalType, duration || null, finalSize || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, video_url, video_type, duration, size } = req.body;
    
    let finalVideoUrl = video_url;
    let finalSize = size;
    let finalType = video_type;
    let finalDuration = duration;

    if (req.file) {
      finalVideoUrl = req.file.path || `/uploads/${req.file.filename}`;
      finalSize = req.file.size ? (req.file.size / (1024 * 1024)).toFixed(1) + ' MB' : 'Unknown Size';
      finalType = req.file.mimetype ? req.file.mimetype.split('/')[1] : 'mp4';
    }

    const oldResult = await db.query('SELECT video_url FROM videos WHERE id = $1', [id]);
    const oldVideoUrl = oldResult.rows[0]?.video_url;

    const result = await db.query(
      'UPDATE videos SET name = COALESCE($1, name), video_url = COALESCE($2, video_url), video_type = COALESCE($3, video_type), duration = COALESCE($4, duration), size = COALESCE($5, size), updated_at = NOW() WHERE id = $6 RETURNING *',
      [
        name !== undefined ? name : null, 
        finalVideoUrl !== undefined ? finalVideoUrl : null, 
        finalType !== undefined ? finalType : null, 
        finalDuration !== undefined ? finalDuration : null,
        finalSize !== undefined ? finalSize : null,
        id
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (req.file && oldVideoUrl && oldVideoUrl.startsWith('/uploads/') && oldVideoUrl !== finalVideoUrl) {
      try {
        const oldPath = path.join(__dirname, '..', oldVideoUrl);
        fs.unlink(oldPath, () => {});
      } catch(e) {}
    }
    // Note: Cloudinary files are not deleted here, which is fine for now.

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM videos WHERE id = $1 RETURNING video_url', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    const videoUrl = result.rows[0].video_url;
    if (videoUrl && videoUrl.startsWith('/uploads/')) {
      try {
        const filePath = path.join(__dirname, '..', videoUrl);
        fs.unlink(filePath, () => {});
      } catch(e) {}
    }
    // Note: Cloudinary files are not deleted here, which is fine for now.
    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const linkVideoToQRs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { qr_ids } = req.body;
    
    if (!qr_ids || qr_ids.length === 0) {
      return res.status(400).json({ error: 'No QR codes provided' });
    }

    const videoResult = await db.query('SELECT video_url, video_type FROM videos WHERE id = $1', [id]);
    if (videoResult.rows.length === 0) return res.status(404).json({ error: 'Video not found' });
    const video = videoResult.rows[0];

    for (const qr_id of qr_ids) {
      const campResult = await db.query("SELECT id FROM campaigns WHERE qr_id = $1 AND status = 'active' LIMIT 1", [qr_id]);
      
      let campaignId;
      if (campResult.rows.length === 0) {
        const qrResult = await db.query("SELECT name FROM qr_codes WHERE id = $1", [qr_id]);
        const qrName = qrResult.rows[0]?.name || 'QR';
        
        const newCamp = await db.query(
          "INSERT INTO campaigns (qr_id, name, created_by) VALUES ($1, $2, $3) RETURNING id",
          [qr_id, qrName, req.user.id]
        );
        campaignId = newCamp.rows[0].id;
      } else {
        campaignId = campResult.rows[0].id;
      }

      const maxVersion = await db.query(
        'SELECT COALESCE(MAX(version_number), 0) + 1 as next_version FROM campaign_versions WHERE campaign_id = $1',
        [campaignId]
      );
      const nextVersion = maxVersion.rows[0].next_version;

      await db.query(
        'UPDATE campaign_versions SET is_active = false WHERE campaign_id = $1',
        [campaignId]
      );

      await db.query(
        `INSERT INTO campaign_versions (campaign_id, version_number, video_type, video_url, is_active) 
         VALUES ($1, $2, $3, $4, true)`,
        [campaignId, nextVersion, video.video_type, video.video_url]
      );
    }

    res.json({ message: 'Video linked successfully' });
  } catch (err) {
    next(err);
  }
};

export const unlinkVideoFromQRs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { qr_ids } = req.body;
    
    if (!qr_ids || qr_ids.length === 0) {
      return res.status(400).json({ error: 'No QR codes provided' });
    }

    const videoResult = await db.query('SELECT video_url FROM videos WHERE id = $1', [id]);
    if (videoResult.rows.length === 0) return res.status(404).json({ error: 'Video not found' });
    const video = videoResult.rows[0];

    for (const qr_id of qr_ids) {
      const campResult = await db.query("SELECT id FROM campaigns WHERE qr_id = $1 AND status = 'active' LIMIT 1", [qr_id]);
      if (campResult.rows.length > 0) {
        const campaignId = campResult.rows[0].id;
        await db.query(
          "UPDATE campaign_versions SET is_active = false WHERE campaign_id = $1 AND video_url = $2 AND is_active = true",
          [campaignId, video.video_url]
        );
      }
    }
    res.json({ message: 'QR codes unlinked successfully' });
  } catch (err) {
    next(err);
  }
};
