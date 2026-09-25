import type { VercelRequest, VercelResponse } from '@vercel/node';
const { getApp } = require('../dist/server.cjs') as { getApp: () => Promise<any> };

function restoreApiPath(req: VercelRequest) {
  const rawPath = req.query.path;
  if (!rawPath) return;

  const apiPath = Array.isArray(rawPath) ? rawPath.join('/') : String(rawPath);
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue;
    if (Array.isArray(value)) value.forEach((v) => query.append(key, String(v)));
    else if (value !== undefined) query.set(key, String(value));
  }

  req.url = `/api/${apiPath}${query.toString() ? `?${query.toString()}` : ''}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    restoreApiPath(req);
    const app = await getApp();
    // Express applications are callable functions, but preserve compatibility with
    // wrapped/bundled Express exports by invoking the native request handler.
    if (typeof app === 'function') return app(req, res);
    if (app && typeof (app as any).handle === 'function') {
      return (app as any).handle(req, res);
    }
    throw new Error('API app handler is not callable');
  } catch (error) {
    console.error('[Miami API] Failed to initialize API:', error);
    return res.status(500).json({ error: 'Failed to initialize API' });
  }
}
