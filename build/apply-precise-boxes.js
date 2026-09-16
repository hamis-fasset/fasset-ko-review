#!/usr/bin/env node
/*
 * Refine OCR match rectangles to the exact source words. This prevents the
 * Korean overlay from covering adjacent icons, badges, and runtime values.
 *
 * usage: node apply-precise-boxes.js <review-tool-dir> <refined-ocr.json> [pristine-ocr.json]
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || '');
const refinedPath = path.resolve(process.argv[3] || '');
if (!root || !refinedPath || !fs.existsSync(refinedPath)) {
  console.error('usage: node apply-precise-boxes.js <review-tool-dir> <refined-ocr.json> [pristine-ocr.json]');
  process.exit(2);
}

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sourceOcrPath = process.argv[4] ? path.resolve(process.argv[4]) : path.join(root, 'data/ocr.json');
const ocr = read(sourceOcrPath);
const copy = read(path.join(root, 'data/copy.json'));
const refined = read(refinedPath);
const byKey = Object.fromEntries(copy.map(row => [row.k, row]));

const token = value => {
  const raw = String(value || '').trim();
  if (raw === '•') return '•';
  if (raw === '&') return '&';
  if (raw === '-') return '-';
  return raw.toLocaleLowerCase('en-US').replace(/[^a-z0-9가-힣]+/g, '');
};
const targetText = (source, values) => String(source || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => values?.[name] ?? '');
const overlap = (a1, a2, b1, b2) => Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
const union = boxes => ({
  x: Math.min(...boxes.map(b => b.x)),
  y: Math.min(...boxes.map(b => b.y)),
  w: Math.max(...boxes.map(b => b.x + b.w)) - Math.min(...boxes.map(b => b.x)),
  h: Math.max(...boxes.map(b => b.y + b.h)) - Math.min(...boxes.map(b => b.y))
});

function exactRange(tokens, wanted) {
  const compact = (tokens || []).map((item, index) => ({value: token(item.text), index})).filter(item => item.value);
  const have = compact.map(item => item.value);
  let need = String(wanted || '').replace(/\s*\/\s*/g, '/').split(/\s+/).map(token).filter(Boolean);
  if (need[0] === '•' && !have.includes('•')) need = need.slice(1);
  if (!need.length) return null;
  for (let start = 0; start <= have.length - need.length; start++) {
    if (need.every((part, i) => have[start + i] === part)) return [compact[start].index, compact[start + need.length - 1].index + 1];
  }
  // OCR often clips the last character at a viewport edge. Accept this only
  // when every source token aligns and one side is a prefix of the other.
  if (have.length === need.length && need.every((part, i) => {
    const got = have[i];
    return got === part || (Math.min(got.length, part.length) >= 4 && (got.startsWith(part) || part.startsWith(got)));
  })) return [compact[0].index, compact[compact.length - 1].index + 1];
  return null;
}

let refinedCount = 0;
let unsafeCount = 0;
const unsafe = [];

for (const [screenId, model] of Object.entries(ocr)) {
  const source = refined[`${screenId}.jpg`];
  if (!source) continue;
  for (const match of model.matches || []) {
    const row = byKey[match.k];
    if (!row) continue;
    const wanted = targetText(row.en, match.vals);
    const search = match.originalBox || match;
    const nearby = (source.lines || []).filter(line => {
      const vertical = overlap(search.y - 12, search.y + search.h + 12, line.y, line.y + line.h);
      return vertical || Math.abs((search.y + search.h / 2) - (line.y + line.h / 2)) <= Math.max(search.h, line.h) * 1.2;
    }).sort((a, b) => a.y - b.y || a.x - b.x);
    const candidates = [];
    for (let start = 0; start < nearby.length; start++) {
      for (let span = 1; span <= Math.min(6, nearby.length - start); span++) {
        const lines = nearby.slice(start, start + span);
        if (span > 1 && lines.some((line, i) => i && line.y - lines[i - 1].y > Math.max(line.h, lines[i - 1].h) * 2.6)) break;
        const tokens = lines.flatMap(line => line.tokens || []);
        const range = exactRange(tokens, wanted);
        if (!range) continue;
        const boxes = tokens.slice(range[0], range[1]);
        if (!boxes.length) continue;
        const box = union(boxes);
        const horizontal = overlap(search.x, search.x + search.w, box.x, box.x + box.w);
        const distance = Math.abs((search.y + search.h / 2) - (box.y + box.h / 2));
        candidates.push({lines, tokens, range, box, score: horizontal * 10 - distance - span});
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    if (!best) {
      match.visualSafe = false;
      unsafe.push(`${screenId}: ${match.k} (${match.text})`);
      unsafeCount++;
      continue;
    }

    match.originalBox ||= {x: match.x, y: match.y, w: match.w, h: match.h};
    Object.assign(match, best.box);
    match.lh = Math.max(...best.tokens.slice(best.range[0], best.range[1]).map(tokenBox => tokenBox.h));
    match.lines = best.lines.length;
    if (best.lines.length > 1) {
      const lefts = best.lines.map(line => line.x);
      const centers = best.lines.map(line => line.x + line.w / 2);
      const spread = values => Math.max(...values) - Math.min(...values);
      match.align = spread(lefts) <= 18 ? 'left' : spread(centers) <= 28 ? 'center' : 'left';
    } else {
      const center = best.box.x + best.box.w / 2;
      match.align = best.box.x > source.width * 0.55 ? 'right' : (Math.abs(center - source.width / 2) < 40 && best.box.w < source.width * 0.65 ? 'center' : 'left');
    }

    const outside = best.tokens.filter((_, index) => index < best.range[0] || index >= best.range[1]);
    const unsafeWords = outside.map(t => String(t.text || '').replace(/[^A-Za-z]/g, '')).filter(w => w.length > 2);
    const sameRow = outside.filter(other => overlap(best.box.y, best.box.y + best.box.h, other.y, other.y + other.h) > 0);
    const leftNeighbor = sameRow.filter(other => other.x + other.w <= best.box.x).sort((a, b) => (b.x + b.w) - (a.x + a.w))[0];
    const rightNeighbor = sameRow.filter(other => other.x >= best.box.x + best.box.w).sort((a, b) => a.x - b.x)[0];
    const safePad = gap => Math.max(1, Math.min(12, Math.floor(gap / 2)));
    match.patchPad = {
      left: leftNeighbor ? safePad(best.box.x - (leftNeighbor.x + leftNeighbor.w)) : 12,
      right: rightNeighbor ? safePad(rightNeighbor.x - (best.box.x + best.box.w)) : 12,
      top: 4,
      bottom: 4
    };
    match.visualSafe = unsafeWords.length === 0;
    match.stripLeadingBullet = /^\s*•/.test(row.en) && !best.tokens.slice(best.range[0], best.range[1]).some(item => token(item.text) === '•');
    match.ocrLine = best.lines.map(line => line.text).join(' ');
    if (!match.visualSafe) {
      unsafe.push(`${screenId}: ${match.k} (${match.ocrLine})`);
      unsafeCount++;
    }
    refinedCount++;
  }
}

fs.writeFileSync(path.join(root, 'data/ocr.json'), JSON.stringify(ocr));
console.log(JSON.stringify({refined: refinedCount, unsafe: unsafeCount, unsafeMatches: unsafe}, null, 2));
