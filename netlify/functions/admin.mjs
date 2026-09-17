import { getStore } from '@netlify/blobs';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

const json = (value, status = 200) => Response.json(value, {
  status,
  headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
});
const same = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
};
const summary = r => ({
  id: r.id,
  reviewerName: r.reviewerName,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  submittedAt: r.submittedAt || null,
  edits: Object.keys(r.state?.edits || {}).length,
  approved: Object.keys(r.state?.approved || {}).length,
  screensDone: Object.keys(r.state?.done || {}).length,
  viewCreatedAt: r.viewCreatedAt || null,
});

export default async req => {
  try {
    const secret = process.env.ADMIN_TOKEN || '';
    const supplied = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
    if (secret.length < 24 || !same(secret, supplied)) return json({ error: 'Admin access denied.' }, 401);

    const store = getStore('korean-copy-reviews');
    const url = new URL(req.url);
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      if (body.action === 'createView') {
        const id = String(body.id || '');
        if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'Invalid review.' }, 400);
        const key = `session:${id}`;
        const record = await store.get(key, { type: 'json', consistency: 'strong' });
        if (!record) return json({ error: 'Review not found.' }, 404);
        const viewToken = randomBytes(32).toString('hex');
        const now = new Date().toISOString();
        await store.setJSON(key, { ...record, viewTokenHash: createHash('sha256').update(viewToken).digest('hex'), viewCreatedAt: now });
        return json({ id, viewToken, reviewerName: record.reviewerName, viewCreatedAt: now });
      }
      const reviewerName = String(body.reviewerName || '').trim().slice(0, 100);
      if (!reviewerName) return json({ error: 'Reviewer name is required.' }, 400);
      const id = randomUUID();
      const token = randomBytes(32).toString('hex');
      const now = new Date().toISOString();
      const tokenHash = createHash('sha256').update(token).digest('hex');
      await store.setJSON(`session:${id}`, { id, tokenHash, viewTokenHash: null, reviewerName, createdAt: now, updatedAt: now, submittedAt: null, state: { edits: {}, approved: {}, done: {}, build: '' } });
      return json({ id, token, reviewerName, createdAt: now }, 201);
    }
    if (req.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);

    const id = url.searchParams.get('id');
    if (id) {
      const record = await store.get(`session:${id}`, { type: 'json', consistency: 'strong' });
      if (!record) return json({ error: 'Review not found.' }, 404);
      const { tokenHash, viewTokenHash, ...safe } = record;
      return json(safe);
    }

    const listed = await store.list({ prefix: 'session:' });
    const records = await Promise.all((listed.blobs || []).map(item => store.get(item.key, { type: 'json' })));
    return json(records.filter(Boolean).map(summary).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))));
  } catch (error) {
    console.error(error);
    return json({ error: 'The admin service could not complete that request.' }, 500);
  }
};

export const config = { path: '/api/admin' };
