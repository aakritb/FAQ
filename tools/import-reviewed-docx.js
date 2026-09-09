#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const source = process.argv[2];
const output = process.argv[3] || path.join(ROOT, 'assets/js/reviewed-content.js');
if (!source) throw new Error('Pass the reviewed .docx path.');

const xml = execFileSync('unzip', ['-p', source, 'word/document.xml'], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
const numbering = execFileSync('unzip', ['-p', source, 'word/numbering.xml'], { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 });
const decode = (value = '') => value
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const textOf = (paragraph) => [...paragraph.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:(?:br|tab)\s*\/>/g)]
  .map((match) => match[1] === undefined ? ' ' : decode(match[1])).join('').replace(/\s+/g, ' ').replace(/:([A-Z])/g, ': $1').trim();
const styleOf = (paragraph) => paragraph.match(/<w:pStyle\s+w:val="([^"]+)"/)?.[1] || '';
const numIdOf = (paragraph) => paragraph.match(/<w:numId\s+w:val="([^"]+)"/)?.[1] || '';
const levelOf = (paragraph) => Number(paragraph.match(/<w:ilvl\s+w:val="([^"]+)"/)?.[1] || 0);

const abstractFormats = {};
for (const match of numbering.matchAll(/<w:abstractNum\s+w:abstractNumId="([^"]+)"[\s\S]*?<\/w:abstractNum>/g)) {
  const levels = {};
  for (const level of match[0].matchAll(/<w:lvl\s+w:ilvl="([^"]+)"[\s\S]*?<w:numFmt\s+w:val="([^"]+)"[\s\S]*?<\/w:lvl>/g)) levels[level[1]] = level[2];
  abstractFormats[match[1]] = levels;
}
const numFormats = {};
for (const match of numbering.matchAll(/<w:num\s+w:numId="([^"]+)"[\s\S]*?<w:abstractNumId\s+w:val="([^"]+)"[\s\S]*?<\/w:num>/g)) numFormats[match[1]] = abstractFormats[match[2]] || {};

const records = [];
let category = '';
let current = null;
for (const match of xml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)) {
  const paragraph = match[0];
  const text = textOf(paragraph);
  if (!text) continue;
  // The review document includes category totals as editorial bookkeeping.
  // They are not part of any answer and must never be published as body copy.
  if (/^\d+\s+(?:questions?|articles?)\s+in\s+this\s+category\.?$/i.test(text)) continue;
  const style = styleOf(paragraph);
  if (style === 'Heading1') { category = text; continue; }
  if (style === 'Heading2') {
    current = { title: text.replace(/^\d+\.\s*/, ''), category, blocks: [] };
    records.push(current);
    continue;
  }
  if (!current) continue;
  if (style === 'Heading3') { current.blocks.push({ type: 'heading', text }); continue; }
  const numId = numIdOf(paragraph);
  if (numId) {
    const level = levelOf(paragraph);
    const format = numFormats[numId]?.[String(level)] || 'bullet';
    const type = format === 'bullet' ? 'list' : 'steps';
    const previous = current.blocks[current.blocks.length - 1];
    if (previous?.type === type && previous.level === level) previous.items.push(text);
    else current.blocks.push({ type, level, items: [text] });
  } else current.blocks.push({ type: 'paragraph', text });
}

const ctx = { window: {} };
for (let i = 1; i <= 6; i += 1) vm.runInNewContext(fs.readFileSync(path.join(ROOT, `questions-${i}.js`), 'utf8'), ctx);
const articles = ctx.window.ASSUREONE_ARTICLES || [];
const normalize = (value = '') => value.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const byTitle = new Map(records.map((record) => [normalize(record.title), record]));
const reviewed = {};
const missing = [];
for (const article of articles) {
  const record = byTitle.get(normalize(article.title));
  if (!record) { missing.push(article.title); continue; }
  const blocks = record.blocks.slice();
  const firstParagraph = blocks.findIndex((block) => block.type === 'paragraph');
  const answer = firstParagraph >= 0 ? blocks.splice(firstParagraph, 1)[0].text : article.answer;
  reviewed[article.id] = { category: record.category, answer, blocks };
}
if (missing.length || Object.keys(reviewed).length !== articles.length) {
  throw new Error(`Reviewed-content match failed. Matched ${Object.keys(reviewed).length}/${articles.length}. Missing: ${missing.join(' | ')}`);
}
const payload = `/* Generated from the client-reviewed Word document. Do not hand-edit. */\nwindow.ASSUREPRO_REVIEWED_CONTENT=${JSON.stringify(reviewed, null, 2)};\n`;
fs.writeFileSync(output, payload);
console.log(`Imported ${Object.keys(reviewed).length} reviewed answers to ${path.relative(ROOT, output)}.`);
