import { INITIAL_CATEGORIES, INITIAL_MENU_ITEMS } from './menu-data.ts';

function config() {
  const rawUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl) throw new Error('Missing SUPABASE_URL environment variable');
  if (!key) throw new Error('Missing Supabase server key environment variable');
  const normalizedKey = key.trim();
  return { url: rawUrl.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, ''), key: normalizedKey, isNewSecretKey: normalizedKey.startsWith('sb_secret_') };
}
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key, isNewSecretKey } = config();
  const headers: Record<string,string> = { apikey:key, 'Content-Type':'application/json', Prefer:'return=representation', ...(init.headers as Record<string,string> || {}) };
  if (!isNewSecretKey) headers.Authorization = 'Bearer '+key;
  const response = await fetch(url+'/rest/v1/'+path,{...init,headers});
  const text = await response.text();
  if (!response.ok) {
    let detail=text; try { const parsed=JSON.parse(text); detail=parsed.message||parsed.error_description||parsed.error||parsed.hint||text; } catch {}
    throw new Error(`Supabase request failed (${response.status}): ${detail}`);
  }
  return text ? JSON.parse(text) : (null as T);
}
export async function getSupabaseCategories() {
  const params = new URLSearchParams({select:'*',order:'display_order.asc'});
  return request<any[]>(`menu_categories?${params.toString()}`);
}
export async function getSupabaseMenuItems(includeUnavailable=true) {
  const params = new URLSearchParams({select:'*,menu_categories(name)',order:'created_at.asc'});
  if (!includeUnavailable) params.set('is_available','eq.true');
  const rows=await request<any[]>(`menu_items?${params.toString()}`);
  return rows.map((item:any)=>({ ...item, category_name:item.menu_categories?.name || 'Uncategorized', menu_categories:undefined }));
}
export async function updateSupabaseMenuItem(id:string, updates:Record<string,unknown>) {
  const allowed=['is_available','price_kes','name','description','is_featured','image_url'];
  const body:Record<string,unknown>={updated_at:new Date().toISOString()};
  for (const key of allowed) if (updates[key] !== undefined) body[key]=updates[key];
  const rows=await request<any[]>(`menu_items?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(body)});
  return rows[0] || null;
}
export async function ensureMenuSeeded() {
  const existing=await request<any[]>('menu_categories?select=id&limit=1');
  if (existing.length) return;
  const now=new Date().toISOString();
  const categories=INITIAL_CATEGORIES.map(c=>({id:c.id,name:c.name,slug:c.slug,description:c.description,display_order:c.display_order,is_active:c.is_active,created_at:now}));
  await request('menu_categories',{method:'POST',body:JSON.stringify(categories)});
  const catMap=new Map(categories.map(c=>[c.slug,c.id]));
  const items=INITIAL_MENU_ITEMS.map(item=>({id:item.id,category_id:catMap.get(item.category_slug)||categories[0].id,name:item.name,description:item.description,price_kes:item.price_kes,image_url:item.image_url,is_available:item.is_available,is_featured:item.is_featured,created_at:now,updated_at:now}));
  await request('menu_items',{method:'POST',body:JSON.stringify(items)});
}
