import { db } from '../config/db.js';

export const getCampaignStats = async (req, res, next) => {
  try {
    const now = new Date();
    const currStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const curr = await db.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'paused') as paused
       FROM campaigns WHERE created_at >= $1`,
      [currStart]
    );
    const prev = await db.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'paused') as paused
       FROM campaigns WHERE created_at >= $1 AND created_at <= $2`,
      [prevStart, prevEnd]
    );

    const c = curr.rows[0];
    const p = prev.rows[0];

    const pct = (curr, prev) => {
      const a = parseInt(curr);
      const b = parseInt(prev);
      if (b === 0) return a > 0 ? 100 : 0;
      return Math.round(((a - b) / b) * 100);
    };

    res.json({
      current: { total: parseInt(c.total), active: parseInt(c.active), completed: parseInt(c.completed), paused: parseInt(c.paused) },
      previous: { total: parseInt(p.total), active: parseInt(p.active), completed: parseInt(p.completed), paused: parseInt(p.paused) },
      change: { total: pct(c.total, p.total), active: pct(c.active, p.active), completed: pct(c.completed, p.completed), paused: pct(c.paused, p.paused) },
    });
  } catch (err) {
    next(err);
  }
};

export const listCampaigns = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT c.*, q.qr_id, q.name as qr_name,
        (SELECT COUNT(*) FROM campaign_versions WHERE campaign_id = c.id) as version_count,
        (SELECT COUNT(*) FROM scan_events se 
         JOIN campaign_versions v ON se.version_id = v.id 
         WHERE v.campaign_id = c.id) as total_scans,
        (SELECT COUNT(*) FROM cta_clicks cc 
         JOIN campaign_versions v ON cc.version_id = v.id 
         WHERE v.campaign_id = c.id) as cta_clicks,
        (SELECT v.video_type FROM campaign_versions v 
         WHERE v.campaign_id = c.id 
         ORDER BY v.version_number DESC LIMIT 1) as video_type,
        (SELECT v.cta_text FROM campaign_versions v 
         WHERE v.campaign_id = c.id 
         ORDER BY v.version_number DESC LIMIT 1) as cta_text
       FROM campaigns c 
       JOIN qr_codes q ON c.qr_id = q.id 
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const createCampaign = async (req, res, next) => {
  try {
    const { qr_id, name, start_date, end_date, headline, tagline, badge } = req.body;
    const result = await db.query(
      `INSERT INTO campaigns (qr_id, name, start_date, end_date, headline, tagline, badge, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [qr_id, name, start_date || null, end_date || null, headline, tagline, badge, req.user.id]
    );
    // Auto-create version 1
    const campaign = result.rows[0];
    const { video_type, video_url, cta_text, cta_destination } = req.body;
    await db.query(
      `INSERT INTO campaign_versions (campaign_id, version_number, video_type, video_url, cta_text, cta_destination, is_active) 
       VALUES ($1, 1, $2, $3, $4, $5, true)`,
      [campaign.id, video_type || 'library', video_url || null, cta_text || 'Buy Now', cta_destination || null]
    );
    res.status(201).json(campaign);
  } catch (err) {
    next(err);
  }
};

export const getCampaignById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT c.*, q.qr_id, q.name as qr_name FROM campaigns c 
       JOIN qr_codes q ON c.qr_id = q.id WHERE c.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    const versions = await db.query(
      `SELECT v.*, 
        (SELECT COUNT(*) FROM scan_events WHERE version_id = v.id) as total_scans,
        (SELECT COUNT(*) FROM cta_clicks WHERE version_id = v.id) as cta_clicks
       FROM campaign_versions v 
       WHERE v.campaign_id = $1 
       ORDER BY v.version_number DESC`,
      [id]
    );
    const stats = await db.query(
      `SELECT 
        COALESCE(SUM((SELECT COUNT(*) FROM scan_events WHERE version_id = v.id)), 0) as total_scans,
        COALESCE(SUM((SELECT COUNT(*) FROM cta_clicks WHERE version_id = v.id)), 0) as cta_clicks
       FROM campaign_versions v WHERE v.campaign_id = $1`,
      [id]
    );
    res.json({ ...result.rows[0], versions: versions.rows, total_scans: parseInt(stats.rows[0].total_scans), cta_clicks: parseInt(stats.rows[0].cta_clicks) });
  } catch (err) {
    next(err);
  }
};

export const updateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, status, headline, tagline, badge, video_type, video_url, cta_text, cta_destination, rating, reviews } = req.body;

    // Landing page rating (0-5, one decimal) and reviews count (>= 0). Invalid/missing values keep the existing ones.
    const ratingNum = rating === undefined || rating === null || rating === '' ? NaN : Number(rating);
    const safeRating = Number.isFinite(ratingNum) && ratingNum >= 0 && ratingNum <= 5 ? Math.round(ratingNum * 10) / 10 : null;
    const reviewsNum = reviews === undefined || reviews === null || reviews === '' ? NaN : Number(reviews);
    const safeReviews = Number.isInteger(reviewsNum) && reviewsNum >= 0 ? reviewsNum : null;

    const result = await db.query(
      `UPDATE campaigns SET name = COALESCE($1, name), status = COALESCE($2, status),
       headline = COALESCE($3, headline), tagline = COALESCE($4, tagline), badge = COALESCE($5, badge),
       rating = COALESCE($6, rating), reviews = COALESCE($7, reviews),
       updated_at = NOW() WHERE id = $8 RETURNING *`,
      [name, status, headline, tagline, badge, safeRating, safeReviews, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    // Update active version if video/cta fields provided
    if (video_url !== undefined || cta_text !== undefined || cta_destination !== undefined || video_type !== undefined) {
      const updates = [];
      const values = [];
      let paramIdx = 1;

      if (video_type !== undefined) {
        updates.push(`video_type = $${paramIdx++}`);
        values.push(video_type);
      }
      if (video_url !== undefined) {
        updates.push(`video_url = $${paramIdx++}`);
        values.push(video_url);
      }
      if (cta_text !== undefined) {
        updates.push(`cta_text = $${paramIdx++}`);
        values.push(cta_text);
      }
      if (cta_destination !== undefined) {
        updates.push(`cta_destination = $${paramIdx++}`);
        values.push(cta_destination);
      }

      if (updates.length > 0) {
        updates.push(`updated_at = NOW()`);
        values.push(id);
        await db.query(
          `UPDATE campaign_versions SET ${updates.join(', ')} WHERE campaign_id = $${paramIdx} AND is_active = true`,
          values
        );
      }
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM campaigns WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    next(err);
  }
};

export const createVersion = async (req, res, next) => {
  try {
    const { id: campaignId } = req.params;
    const { video_type, video_url, cta_text, cta_destination, activate_immediately } = req.body;

    // Get next version number
    const maxVersion = await db.query(
      'SELECT COALESCE(MAX(version_number), 0) + 1 as next_version FROM campaign_versions WHERE campaign_id = $1',
      [campaignId]
    );
    const nextVersion = maxVersion.rows[0].next_version;

    // Deactivate current active version
    if (activate_immediately) {
      await db.query(
        'UPDATE campaign_versions SET is_active = false WHERE campaign_id = $1 AND is_active = true',
        [campaignId]
      );
    }

    const result = await db.query(
      `INSERT INTO campaign_versions (campaign_id, version_number, video_type, video_url, cta_text, cta_destination, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [campaignId, nextVersion, video_type, video_url, cta_text, cta_destination, activate_immediately]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};
