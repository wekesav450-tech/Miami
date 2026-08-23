import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createProfile, findProfileByEmail } from '../../server/supabase-db.js';
import { generateToken, isValidKenyanPhone, formatKenyanPhone } from '../../server/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { full_name, email, phone, password } = req.body || {};
    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) return res.status(400).json({ error: 'Please provide a valid full name' });
    if (!email || typeof email !== 'string' || !email.includes('@')) return res.status(400).json({ error: 'Please provide a valid email address' });
    if (!phone || !isValidKenyanPhone(String(phone))) return res.status(400).json({ error: 'Please enter a valid Kenyan phone number (e.g. 0741775878)' });
    if (!password || typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters long' });

    const normalizedEmail = String(email).trim().toLowerCase();
    if (await findProfileByEmail(normalizedEmail)) return res.status(409).json({ error: 'An account with this email already exists' });

    const profile = await createProfile({
      full_name: String(full_name),
      email: normalizedEmail,
      phone: formatKenyanPhone(String(phone)),
      password: String(password),
      role: 'customer',
    });
    const token = generateToken(profile);
    return res.status(201).json({
      profile: { id: profile.id, full_name: profile.full_name, email: profile.email, phone: profile.phone, role: profile.role, created_at: profile.created_at, updated_at: profile.updated_at },
      token,
    });
  } catch (error) {
    console.error('Auth register API failed:', error);
    return res.status(500).json({ error: 'Failed to create user account', detail: error instanceof Error ? error.message : String(error) });
  }
}
