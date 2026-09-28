import { db } from '../config/db.js';
import { comparePassword, hashPassword } from '../utils/hashPassword.js';

export const getAdminNotifications = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 6, 100);
    const scans = await db.query(
      `SELECT se.id, 'scan' as type, se.scanned_at as time, q.name as qr_name, se.city 
       FROM scan_events se 
       JOIN qr_codes q ON se.qr_id = q.id 
       ORDER BY se.scanned_at DESC LIMIT $1`, [limit]
    );

    const campaigns = await db.query(
      `SELECT id, 'campaign' as type, created_at as time, name as qr_name, null as city
       FROM campaigns 
       ORDER BY created_at DESC LIMIT $1`, [limit]
    );

    const all = [...scans.rows, ...campaigns.rows].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, limit);
    
    res.json(all);
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, phone, company, role, created_at, updated_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, company } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existingEmail = await db.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, req.user.id]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use by another account' });
    }

    const result = await db.query(
      `UPDATE users SET name = $1, email = $2, phone = $3, company = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, email, phone, company, role, created_at, updated_at`,
      [name, email, phone || null, company || null, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update profile error:', err.message);
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await comparePassword(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashed = await hashPassword(newPassword);
    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashed, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    next(err);
  }
};

export const getTwoFactor = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT sms_auth, email_auth FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateTwoFactor = async (req, res, next) => {
  try {
    const { sms_auth, email_auth } = req.body;
    const result = await db.query(
      `UPDATE users SET sms_auth = $1, email_auth = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING sms_auth, email_auth`,
      [sms_auth, email_auth, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update 2FA error:', err.message);
    next(err);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT email_alerts, scan_alerts, weekly_report, campaign_updates FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const r = result.rows[0];
    res.json({
      emailAlerts: r.email_alerts,
      scanAlerts: r.scan_alerts,
      weeklyReport: r.weekly_report,
      campaignUpdates: r.campaign_updates,
    });
  } catch (err) {
    next(err);
  }
};

export const updateNotifications = async (req, res, next) => {
  try {
    const { emailAlerts, scanAlerts, weeklyReport, campaignUpdates } = req.body;
    const result = await db.query(
      `UPDATE users SET email_alerts = $1, scan_alerts = $2, weekly_report = $3, campaign_updates = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING email_alerts, scan_alerts, weekly_report, campaign_updates`,
      [emailAlerts, scanAlerts, weeklyReport, campaignUpdates, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const r = result.rows[0];
    res.json({
      emailAlerts: r.email_alerts,
      scanAlerts: r.scan_alerts,
      weeklyReport: r.weekly_report,
      campaignUpdates: r.campaign_updates,
    });
  } catch (err) {
    console.error('Update notifications error:', err.message);
    next(err);
  }
};
