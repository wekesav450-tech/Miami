import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ connected: true })}\n\n`);
  const timer = setInterval(() => {
    try { res.write(`: heartbeat ${Date.now()}\n\n`); } catch { clearInterval(timer); }
  }, 25000);
  _req.on('close', () => clearInterval(timer));
}
