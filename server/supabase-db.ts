import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl) throw new Error('Missing SUPABASE_URL environment variable');
  if (!key) throw new Error('Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable');

  const url = rawUrl.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '');
  const normalizedKey = key.trim();
  const isNewSecretKey = normalizedKey.startsWith('sb_secret_');
  return { url, key: normalizedKey, isNewSecretKey };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key, isNewSecretKey } = config();
  const headers: Record<string, string> = {
    apikey: key,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };

  // New sb_secret_* keys are opaque API keys, not JWTs. Supabase requires
  // them in `apikey` and rejects them when sent as Authorization: Bearer.
  // Legacy service_role keys are JWT API keys and can use both headers.
  if (!isNewSecretKey) {
    headers.Authorization = `Bearer ${key}`;
  }

  for (const [name, value] of Object.entries(init.headers || {})) {
    headers[name] = String(value);
  }

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers,
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
