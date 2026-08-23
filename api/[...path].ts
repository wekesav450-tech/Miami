import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApp } from '../server';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('API handler boot error:', error);
    return res.status(500).json({ error: 'API failed to initialize' });
  }
}
