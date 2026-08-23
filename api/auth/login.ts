import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'new_miami_restaurant_jwt_secure_key_naivasha';

type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  password_hash: string;
  created_at: string;
  updated_at: string;
};

function loadProfiles(): Profile[] {
  const file = path.join(process.cwd(), 'database.json');
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(parsed.profiles) ? parsed.profiles : [];
  } catch (error) {
    console.error('[Login] database.json read failed:', error);
    return [];
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const profile = loadProfiles().find((p) => p.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!profile || !profile.password_hash || !bcrypt.compareSync(String(password), profile.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: profile.id, email: profile.email, role: profile.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
      token,
    });
  } catch (error) {
    console.error('[Login] API failure:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}
