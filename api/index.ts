import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApp } from '../server.ts';

function restoreApiPath(req: VercelRequest) {
  const rawPath = req.query.path;
  if (!rawPath) return;

  const path = Array.isArray(rawPath) ? rawPath.join('/') : String(rawPath);
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue;
    if (Array.isArray(value)) value.forEach((v) => query.append(key, String(v)));
    else if (value !== undefined) query.set(key, String(value));
  }

  req.url = `/api/${path}${query.toString() ? `?${query.toString()}` : ''}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    restoreApiPath(req);
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('[Miami API] Failed to initialize API:', error);
    return res.status(500).json({ error: 'Failed to initialize API' });
  }
}
