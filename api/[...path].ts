import type { VercelRequest, VercelResponse } from '@vercel/node';

let appPromise: Promise<any> | undefined;

async function getBundledApp() {
  if (!appPromise) {
    appPromise = import('../dist/server.cjs').then((mod) => mod.getApp());
  }
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getBundledApp();
    return app(req, res);
  } catch (error) {
    console.error('Miami API initialization failed:', error);
    return res.status(500).json({
      error: 'API failed to initialize',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}
