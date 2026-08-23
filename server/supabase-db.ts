import bcrypt from 'bcryptjs';

export interface SupabaseProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  password_hash: string;
  created_at: string;
  updated_at: string;
}

function config() {
  // Accept the project URL with or without /rest/v1, because either form may
  // have been copied from Supabase/Vercel. The REST path is added below.
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!rawUrl) throw new Error('Missing SUPABASE_URL environment variable');
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY environment variable');

  const url = rawUrl.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '');
  return { url, key: key.trim() };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      detail = parsed.message || parsed.error_description || parsed.error || parsed.hint || text;
    } catch { /* keep raw response */ }
    throw new Error(`Supabase request failed (${response.status}): ${detail}`);
  }

  return text ? JSON.parse(text) : (null as T);
}

export async function findProfileByEmail(email: string): Promise<SupabaseProfile | null> {
  const rows = await request<SupabaseProfile[]>(`profiles?email=eq.${encodeURIComponent(email.trim().toLowerCase())}&limit=1`);
  return rows[0] || null;
}

export async function findProfileById(id: string): Promise<SupabaseProfile | null> {
  const rows = await request<SupabaseProfile[]>(`profiles?id=eq.${encodeURIComponent(id)}&limit=1`);
  return rows[0] || null;
}

export async function createProfile(data: {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role?: 'customer' | 'admin';
}): Promise<SupabaseProfile> {
  const password_hash = bcrypt.hashSync(data.password, 10);
  const now = new Date().toISOString();
  const rows = await request<SupabaseProfile[]>('profiles', {
    method: 'POST',
    body: JSON.stringify({
      id: `usr_${crypto.randomUUID()}`,
      full_name: data.full_name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      role: data.role || 'customer',
      password_hash,
      created_at: now,
      updated_at: now,
    }),
  });
  if (!rows?.[0]) throw new Error('Supabase did not return the created profile');
  return rows[0];
}

export async function ensureInitialAdmin(): Promise<SupabaseProfile> {
  const email = (process.env.ADMIN_INITIAL_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_INITIAL_PASSWORD || '';
  if (!email || !password) throw new Error('Initial admin environment variables are not configured');

  const existing = await findProfileByEmail(email);
  if (existing) return existing;

  return createProfile({
    full_name: 'New Miami Admin',
    email,
    phone: '0741775878',
    password,
    role: 'admin',
  });
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
