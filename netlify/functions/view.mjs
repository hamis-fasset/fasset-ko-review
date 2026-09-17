import { getStore } from '@netlify/blobs';
import { createHash, timingSafeEqual } from 'node:crypto';

const json = (value, status = 200) => Response.json(value, {
  status,
  headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
});
const same = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
};

export default async req => {
  try {
    if (req.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);
    const url = new URL(req.url);
    const id = url.searchParams.get('id') || '';
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
    if (!/^[0-9a-f-]{36}$/i.test(id) || token.length < 32) return json({ error: 'Invalid view link.' }, 401);
    const record = await getStore('korean-copy-reviews').get(`session:${id}`, { type: 'json', consistency: 'strong' });
    if (!record?.viewTokenHash || !same(record.viewTokenHash, createHash('sha256').update(token).digest('hex'))) return json({ error: 'Invalid view link.' }, 401);
    return json({ id: record.id, title: 'Fasset Korean app preview', updatedAt: record.updatedAt, submittedAt: record.submittedAt || null, state: record.state || { edits: {}, approved: {}, done: {} } });
  } catch (error) {
    console.error(error);
    return json({ error: 'The app preview could not be loaded.' }, 500);
  }
};

export const config = { path: '/api/view' };
