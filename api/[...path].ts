import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApp } from '../server.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('[Vercel API] Failed to initialize Miami API:', error);
    return res.status(500).json({ error: 'Failed to initialize Miami API' });
  }
}
