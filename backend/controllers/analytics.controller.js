import { db } from '../config/db.js';

export const getOverview = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [totalScans, uniqueScans, ctaClicks, activeQr] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM scan_events WHERE scanned_at >= $1', [since]),
      db.query('SELECT COUNT(DISTINCT session_id) as count FROM scan_events WHERE scanned_at >= $1', [since]),
      db.query('SELECT COUNT(*) as count FROM cta_clicks WHERE clicked_at >= $1', [since]),
      db.query("SELECT COUNT(*) as count FROM qr_codes WHERE status = 'active'"),
    ]);

    res.json({
      totalScans: parseInt(totalScans.rows[0].count),
      uniqueScans: parseInt(uniqueScans.rows[0].count),
      ctaClicks: parseInt(ctaClicks.rows[0].count),
      activeQr: parseInt(activeQr.rows[0].count),
    });
  } catch (err) {
    next(err);
  }
};

export const getQRAnalytics = async (req, res, next) => {
  try {
    const { days } = req.query;
    const since = days ? new Date(Date.now() - parseInt(days) * 86400000).toISOString() : null;
    const result = await db.query(
      `SELECT q.id, q.qr_id, q.name, q.status,
        COUNT(DISTINCT se.id) as total_scans,
        COUNT(DISTINCT se.session_id) as unique_scans,
        COUNT(DISTINCT cc.id) as cta_clicks
       FROM qr_codes q
       LEFT JOIN scan_events se ON se.qr_id = q.id ${since ? 'AND se.scanned_at >= $1' : ''}
       LEFT JOIN cta_clicks cc ON cc.qr_id = q.id ${since ? 'AND cc.clicked_at >= $1' : ''}
       GROUP BY q.id ORDER BY total_scans DESC`,
      since ? [since] : []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const getCampaignAnalytics = async (req, res, next) => {
  try {
    const { days } = req.query;
    const since = days ? new Date(Date.now() - parseInt(days) * 86400000).toISOString() : null;
    const result = await db.query(
      `SELECT c.id, c.name, c.status, c.start_date, q.name as qr_name,
        COUNT(DISTINCT se.id) as total_scans,
        COUNT(DISTINCT cc.id) as cta_clicks
       FROM campaigns c
       JOIN qr_codes q ON c.qr_id = q.id
       LEFT JOIN campaign_versions v ON v.campaign_id = c.id
       LEFT JOIN scan_events se ON se.version_id = v.id ${since ? 'AND se.scanned_at >= $1' : ''}
       LEFT JOIN cta_clicks cc ON cc.version_id = v.id ${since ? 'AND cc.clicked_at >= $1' : ''}
       GROUP BY c.id, q.name ORDER BY total_scans DESC`,
      since ? [since] : []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const getVersionAnalytics = async (req, res, next) => {
  try {
    const { days } = req.query;
    const since = days ? new Date(Date.now() - parseInt(days) * 86400000).toISOString() : null;
    const result = await db.query(
      `SELECT v.id, v.version_number, c.name as campaign_name, q.name as qr_name,
        v.video_url, v.cta_text, v.cta_destination, v.is_active,
        COUNT(DISTINCT se.id) as total_scans,
        COUNT(DISTINCT cc.id) as cta_clicks
       FROM campaign_versions v
       JOIN campaigns c ON v.campaign_id = c.id
       JOIN qr_codes q ON c.qr_id = q.id
       LEFT JOIN scan_events se ON se.version_id = v.id ${since ? 'AND se.scanned_at >= $1' : ''}
       LEFT JOIN cta_clicks cc ON cc.version_id = v.id ${since ? 'AND cc.clicked_at >= $1' : ''}
       GROUP BY v.id, c.name, q.name ORDER BY total_scans DESC`,
      since ? [since] : []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const getDeviceAnalytics = async (req, res, next) => {
  try {
    const { days } = req.query;
    const since = days ? new Date(Date.now() - parseInt(days) * 86400000).toISOString() : null;
    const result = await db.query(
      `SELECT device_type, COUNT(*) as count FROM scan_events ${since ? 'WHERE scanned_at >= $1' : ''} GROUP BY device_type ORDER BY count DESC`,
      since ? [since] : []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const getLocationAnalytics = async (req, res, next) => {
  try {
    const { days } = req.query;
    const since = days ? new Date(Date.now() - parseInt(days) * 86400000).toISOString() : null;
    const result = await db.query(
      `SELECT city, country, COUNT(*) as count FROM scan_events 
       WHERE city != 'Unknown' ${since ? 'AND scanned_at >= $1' : ''} GROUP BY city, country ORDER BY count DESC LIMIT 20`,
      since ? [since] : []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const getOverviewDaily = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const result = await db.query(
      `WITH RECURSIVE dates AS (
         SELECT current_date - ($1::int - 1) AS date
         UNION ALL
         SELECT date + 1 FROM dates WHERE date < current_date
       )
       SELECT
         to_char(d.date, 'Dy') as day,
         (SELECT COUNT(*) FROM scan_events WHERE date(scanned_at) = d.date) as scans,
         (SELECT COUNT(*) FROM cta_clicks WHERE date(clicked_at) = d.date) as clicks
       FROM dates d
       ORDER BY d.date ASC`,
      [days]
    );
    res.json(result.rows.map(r => ({
      day: r.day,
      scans: parseInt(r.scans),
      clicks: parseInt(r.clicks),
    })));
  } catch (err) {
    next(err);
  }
};

export const getQRDetailAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;

    const weeklyResult = await db.query(
      `WITH RECURSIVE dates AS (
         SELECT current_date - 6 AS date
         UNION ALL
         SELECT date + 1 FROM dates WHERE date < current_date
       )
       SELECT 
         to_char(d.date, 'Dy') as day,
         to_char(d.date, 'DD Mon') as date_label,
         (SELECT COUNT(*) FROM scan_events WHERE date(scanned_at) = d.date AND qr_id = $1) as scans,
         (SELECT COUNT(*) FROM cta_clicks WHERE date(clicked_at) = d.date AND qr_id = $1) as clicks
       FROM dates d
       ORDER BY d.date ASC`,
      [id]
    );

    const deviceResult = await db.query(
      `SELECT device_type as type, COUNT(*) as count 
       FROM scan_events 
       WHERE qr_id = $1 
       GROUP BY device_type 
       ORDER BY count DESC`,
      [id]
    );

    const totalDeviceScans = deviceResult.rows.reduce((acc, row) => acc + parseInt(row.count), 0);
    const colors = ['#00C8FF', '#0077FF', '#4DDCFF', '#003366'];
    const deviceData = deviceResult.rows.map((row, i) => ({
      type: row.type || 'Other',
      percent: totalDeviceScans > 0 ? Math.round((parseInt(row.count) / totalDeviceScans) * 100) : 0,
      color: colors[i % colors.length]
    }));

    const locationResult = await db.query(
      `SELECT city, COUNT(*) as scans 
       FROM scan_events 
       WHERE qr_id = $1 AND city != 'Unknown' 
       GROUP BY city 
       ORDER BY scans DESC 
       LIMIT 5`,
      [id]
    );
    
    const totalLocationScans = locationResult.rows.reduce((acc, row) => acc + parseInt(row.scans), 0);
    const locations = locationResult.rows.map(row => ({
      city: row.city,
      scans: parseInt(row.scans),
      percent: totalLocationScans > 0 ? Math.round((parseInt(row.scans) / totalLocationScans) * 100) : 0
    }));

    res.json({
      weeklyData: weeklyResult.rows.map(r => ({
        day: r.day,
        date: r.date_label,
        scans: parseInt(r.scans),
        clicks: parseInt(r.clicks)
      })),
      deviceData,
      locations
    });
  } catch (err) {
    next(err);
  }
};

// Date-wise scans for a single QR. ?days=7|30|90, or ?days=all (from QR creation / first scan)
export const getQRDailyAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowedDays = [7, 30, 90];
    const days = allowedDays.includes(parseInt(req.query.days)) ? parseInt(req.query.days) : null;
    const allTime = req.query.days === 'all';
    const rangeDays = allTime ? null : (days || 30);

    const result = await db.query(
      `WITH bounds AS (
         SELECT CASE
           WHEN $2::int IS NULL THEN COALESCE(
             LEAST(
               (SELECT MIN(date(scanned_at)) FROM scan_events WHERE qr_id = $1),
               (SELECT date(created_at) FROM qr_codes WHERE id = $1)
             ),
             current_date
           )
           ELSE current_date - ($2::int - 1)
         END AS start_date
       ),
       days AS (
         SELECT generate_series((SELECT start_date FROM bounds), current_date, interval '1 day')::date AS date
       ),
       s AS (
         SELECT date(scanned_at) AS d, COUNT(*) AS scans, COUNT(DISTINCT session_id) AS unique_scans
         FROM scan_events WHERE qr_id = $1 GROUP BY 1
       ),
       c AS (
         SELECT date(clicked_at) AS d, COUNT(*) AS clicks
         FROM cta_clicks WHERE qr_id = $1 GROUP BY 1
       )
       SELECT to_char(days.date, 'YYYY-MM-DD') AS date,
         COALESCE(s.scans, 0) AS scans,
         COALESCE(s.unique_scans, 0) AS unique_scans,
         COALESCE(c.clicks, 0) AS clicks
       FROM days
       LEFT JOIN s ON s.d = days.date
       LEFT JOIN c ON c.d = days.date
       ORDER BY days.date DESC`,
      [id, rangeDays]
    );

    res.json(result.rows.map(r => ({
      date: r.date,
      scans: parseInt(r.scans),
      unique: parseInt(r.unique_scans),
      clicks: parseInt(r.clicks),
    })));
  } catch (err) {
    next(err);
  }
};
