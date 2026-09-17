import { getStore } from '@netlify/blobs';
import { createHash, timingSafeEqual } from 'node:crypto';

const json = (value, status = 200) => Response.json(value, {
  status,
  headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
});
const hash = value => createHash('sha256').update(value).digest('hex');
const same = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
};
const validId = id => /^[0-9a-f-]{36}$/i.test(String(id || ''));

export default async req => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
    if (!validId(id) || token.length < 32) return json({ error: 'Invalid review link.' }, 401);

    const store = getStore('korean-copy-reviews');
    const key = `session:${id}`;
    const record = await store.get(key, { type: 'json', consistency: 'strong' });
    if (!record || !same(record.tokenHash, hash(token))) return json({ error: 'Invalid review link.' }, 401);

    if (req.method === 'GET') {
      const { tokenHash, ...safe } = record;
      return json(safe);
    }
    if (req.method !== 'PUT') return json({ error: 'Method not allowed.' }, 405);

    const raw = await req.text();
    if (raw.length > 2_000_000) return json({ error: 'Review is too large.' }, 413);
    const body = JSON.parse(raw || '{}');
    const state = body.state;
    if (!state || typeof state !== 'object' || Array.isArray(state)) return json({ error: 'Invalid review state.' }, 400);
    for (const field of ['edits', 'approved', 'done']) {
      if (!state[field] || typeof state[field] !== 'object' || Array.isArray(state[field]) || Object.keys(state[field]).length > 6000) {
        return json({ error: `Invalid ${field}.` }, 400);
      }
    }
    const now = new Date().toISOString();
    const next = {
      ...record,
      reviewerName: String(state.reviewerName || record.reviewerName || 'Reviewer').slice(0, 100),
      state: {
        edits: state.edits,
        approved: state.approved,
        done: state.done,
        build: String(state.build || '').slice(0, 40),
      },
      updatedAt: now,
      submittedAt: body.submitted ? now : record.submittedAt || null,
    };
    await store.setJSON(key, next);
    return json({ ok: true, updatedAt: now, submittedAt: next.submittedAt });
  } catch (error) {
    console.error(error);
    return json({ error: 'The server could not save this review.' }, 500);
  }
};

export const config = { path: '/api/review' };

