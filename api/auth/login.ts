import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureInitialAdmin, findProfileByEmail, verifyPassword } from '../../server/supabase-db.ts';
import { generateToken } from '../../server/auth.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const normalizedEmail = String(email).trim().toLowerCase();
    let profile = await findProfileByEmail(normalizedEmail);

    // Provision the configured initial administrator in Supabase on first admin login.
    if (!profile && process.env.ADMIN_INITIAL_EMAIL?.trim().toLowerCase() === normalizedEmail) {
      profile = await ensureInitialAdmin();
    }

    if (!profile || !profile.password_hash || !verifyPassword(String(password), profile.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(profile);
    return res.status(200).json({
      profile: { id: profile.id, full_name: profile.full_name, email: profile.email, phone: profile.phone, role: profile.role, created_at: profile.created_at, updated_at: profile.updated_at },
      token,
    });
  } catch (error) {
    console.error('[Login] API failure:', error);
    return res.status(500).json({ error: 'Login failed', detail: error instanceof Error ? error.message : String(error) });
  }
}
