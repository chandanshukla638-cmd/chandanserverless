import { db } from '../config/db.js';
import { detectDevice } from '../utils/detectDevice.js';
import { detectLocation } from '../utils/detectLocation.js';
import crypto from 'crypto';

export const getLandingData = async (req, res, next) => {
  try {
    const { qrId } = req.params;

    const qrResult = await db.query(
      "SELECT * FROM qr_codes WHERE qr_id = $1",
      [qrId]
    );
    if (qrResult.rows.length === 0) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    const qr = qrResult.rows[0];

    if (qr.status !== 'active') {
      return res.status(404).json({ error: 'This QR code is inactive' });
    }

    const campaignResult = await db.query(
      "SELECT * FROM campaigns WHERE qr_id = $1 ORDER BY created_at DESC LIMIT 1",
      [qr.id]
    );

    const campaign = campaignResult.rows[0] || null;

    let version = null;
    if (campaign) {
      const versionResult = await db.query(
        'SELECT * FROM campaign_versions WHERE campaign_id = $1 ORDER BY created_at DESC LIMIT 1',
        [campaign.id]
      );
      version = versionResult.rows[0] || null;
    }

    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection?.remoteAddress || '';
    const device = detectDevice(userAgent);
    const location = await detectLocation(ip);
    const sessionId = req.headers['x-session-id'] || crypto.createHash('sha256').update(`${ip}|${userAgent}`).digest('hex');

    if (version) {
      try {
        await db.query(
          `INSERT INTO scan_events (qr_id, version_id, session_id, ip_address, device_type, device_os, browser, city, country, scanned_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [qr.id, version.id, sessionId, ip, device.type, device.os, device.browser, location.city, location.country]
        );

        if (!qr.first_scan_at) {
          await db.query(
            `UPDATE qr_codes SET first_scan_at = NOW(), 
             lifecycle_status = CASE WHEN lifecycle_status = 'packed' THEN 'sold' ELSE lifecycle_status END,
             sold_at = CASE WHEN lifecycle_status = 'packed' THEN NOW() ELSE sold_at END,
             updated_at = NOW() WHERE id = $1`,
            [qr.id]
          );
        }
      } catch (scanErr) {
        console.error('Failed to record scan:', scanErr.message);
      }
    }

    res.json({
      name: qr.name,
      brand: qr.name,
      qr_id: qr.qr_id,
      headline: campaign?.headline || qr.name,
      tagline: campaign?.tagline || '',
      description: campaign?.description || '',
      badge: campaign?.badge || '',
      video_url: version?.video_url || null,
      cta_text: version?.cta_text || 'Learn More',
      cta_url: version?.cta_destination || '#',
      logo_url: qr.logo_url || null,
      features: campaign?.features || [],
      rating: parseFloat(campaign?.rating || 4.8),
      reviews: parseInt(campaign?.reviews || 324),
      likes: parseInt(campaign?.likes || 0),
      scans: parseInt(qr.total_scans || 0),
      version_id: version?.id || null,
    });
  } catch (err) {
    next(err);
  }
};

export const trackCTAClick = async (req, res, next) => {
  try {
    const { versionId } = req.params;
    const { qr_id } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection?.remoteAddress || '';
    const device = detectDevice(userAgent);
    const location = await detectLocation(ip);
    const sessionId = req.headers['x-session-id'] || crypto.createHash('sha256').update(`${ip}|${userAgent}`).digest('hex');

    const versionResult = await db.query(
      `SELECT v.cta_destination, c.qr_id as numeric_qr_id 
       FROM campaign_versions v
       JOIN campaigns c ON v.campaign_id = c.id
       WHERE v.id = $1`,
      [versionId]
    );
    if (versionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const { cta_destination, numeric_qr_id } = versionResult.rows[0];

    await db.query(
      `INSERT INTO cta_clicks (version_id, qr_id, session_id, device_type, city, country, clicked_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [versionId, numeric_qr_id, sessionId, device.type, location.city, location.country]
    );

    res.json({ destination_url: cta_destination });
  } catch (err) {
    next(err);
  }
};

export const toggleLike = async (req, res, next) => {
  try {
    const { qrId } = req.params;
    const { liked } = req.body;

    const qrResult = await db.query("SELECT id FROM qr_codes WHERE qr_id = $1", [qrId]);
    if (qrResult.rows.length === 0) {
      return res.status(404).json({ error: 'QR not found' });
    }
    
    const numericQrId = qrResult.rows[0].id;

    const result = await db.query(
      `UPDATE campaigns 
       SET likes = GREATEST(COALESCE(likes, 0) + $1, 0) 
       WHERE qr_id = $2 AND status = 'active'
       RETURNING likes`,
      [liked ? 1 : -1, numericQrId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Active campaign not found' });
    }

    res.json({ likes: result.rows[0].likes });
  } catch (err) {
    next(err);
  }
};
