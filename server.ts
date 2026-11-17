import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApiV1Router } from './src/server/api';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const USE_VITE_DEV = process.env.FORCE_VITE_DEV === 'true';

async function startServer() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', true);
  app.use(express.json({ limit: '1mb' }));

  // Lightweight security headers (iframe-compatible)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Generous sliding-window rate limiter on /api/v1/*
  const hitCounts = new Map<string, { count: number; resetAt: number }>();
  app.use('/api/v1', (req, res, next) => {
    const ip = req.ip || 'local';
    const now = Date.now();
    const bucket = hitCounts.get(ip);
    if (!bucket || now > bucket.resetAt) {
      hitCounts.set(ip, { count: 1, resetAt: now + 60_000 });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > 600) {
      return res.status(429).json({ error: 'Too many requests, please pause briefly.' });
    }
    return next();
  });

  app.use('/api/v1', createApiV1Router());

  // Serve static image assets for any direct /src/assets references
  app.use('/src/assets', express.static(path.resolve(__dirname, 'src/assets')));

  const distDir = path.resolve(__dirname, 'dist');
  const distIndex = path.join(distDir, 'index.html');
  const staticAssetExt = /\.(?:css|js|mjs|cjs|map|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|eot|json|txt|xml)$/i;

  // Serve pre-bundled dist/ when available (reduces page load from 65+ module requests to ~4 requests,
  // preventing Cloud Run / proxy burst "Rate exceeded" 429s and blank screens).
  if (!USE_VITE_DEV && fs.existsSync(distIndex)) {
    app.use(
      '/assets',
      express.static(path.join(distDir, 'assets'), {
        immutable: true,
        maxAge: '1y',
      })
    );
    app.use(express.static(distDir, { index: false }));
    app.get('*', (req, res) => {
      if (
        req.path.startsWith('/assets/') ||
        req.path.startsWith('/src/') ||
        req.path.startsWith('/@') ||
        req.path.startsWith('/api/') ||
        staticAssetExt.test(req.path)
      ) {
        return res.status(404).type('text/plain').send('Not found');
      }
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.sendFile(distIndex, {
        etag: false,
        lastModified: false,
        cacheControl: false,
      });
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mintly full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Mintly server:', err);
  process.exit(1);
});
