import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Functions are request/response based and should not be used as a
 * permanent SSE connection. The old implementation kept the function alive
 * with setInterval(), which caused 300-second Vercel timeouts.
 *
 * Keep this endpoint short-lived and explicit. Admin realtime updates are
 * handled by the dashboard's safe polling loop instead.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    connected: false,
    transport: 'polling',
    message: 'Realtime SSE is disabled on Vercel; clients use polling.',
  });
}
