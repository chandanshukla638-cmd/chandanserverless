import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import qrRoutes from './routes/qr.routes.js';
import campaignRoutes from './routes/campaign.routes.js';
import videoRoutes from './routes/video.routes.js';
import ctaRoutes from './routes/cta.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import landingRoutes from './routes/landing.routes.js';
import landingContentRoutes from './routes/landingContent.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import userRoutes from './routes/user.routes.js';
import staticQrRoutes from './routes/staticQr.routes.js';
import redirectPresetsRoutes from './routes/redirectPresets.routes.js';
import searchRoutes from './routes/search.routes.js';
import packRoutes from './routes/pack.routes.js';
import leadRoutes from './routes/lead.routes.js';
import categoryRoutes from './routes/category.routes.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Fix for rate limiting on Render
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://akksys-frontend.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

import path from 'path';

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }
  try {
    await db.query(
      'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES ($1, $2, $3, $4, $5)',
      [name, email, phone || null, subject || 'general', message]
    );
    res.status(200).json({ success: true, message: 'Message received successfully' });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

app.get('/api/contact', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch contact messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.put('/api/contact/:id/read', async (req, res) => {
  try {
    await db.query('UPDATE contact_messages SET status = $1 WHERE id = $2', ['read', req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.put('/api/contact/:id/unread', async (req, res) => {
  try {
    await db.query('UPDATE contact_messages SET status = $1 WHERE id = $2', ['unread', req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.delete('/api/contact/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM contact_messages WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/campaign', campaignRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/cta', ctaRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/landing', landingRoutes);
app.use('/api/landing-content', landingContentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/static-qr', staticQrRoutes);
app.use('/api/redirect-presets', redirectPresetsRoutes);
app.use('/api/pack', packRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/categories', categoryRoutes);

app.use(errorHandler);

import { runMigrations } from './migrations/run.js';
import { seed } from './seeds/seed.js';

if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    try {
      await db.query('SELECT NOW()');
      console.log('PostgreSQL connected successfully');

      // Auto-run DB migrations & seed on server start
      await runMigrations(false);
      await seed(false);
    } catch (err) {
      console.error('Database connection error:', err.message);
    }
  });
}

export default app;
