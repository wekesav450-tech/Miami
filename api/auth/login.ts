import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { db } from '../../server/db';
import { generateToken } from '../../server/auth';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const profile = db.findProfileByEmail(String(email));
    if (!profile || !bcrypt.compareSync(String(password), profile.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(profile);
    const safeProfile = {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };

    return res.status(200).json({ profile: safeProfile, token });
  } catch (error) {
    console.error('Auth login API failed:', error);
    return res.status(500).json({
      error: 'Login failed',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}
