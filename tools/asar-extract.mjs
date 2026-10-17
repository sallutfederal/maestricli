// ASAR archive reader/ extractor.
// Layout: [u32 pickle][u32 headerSize][headerSize bytes JSON header][file data...]
// File data for a node starts at 8 + headerSize + node.offset
import fs from 'node:fs';
import path from 'node:path';

const [asarPath, outDir, ...filters] = process.argv.slice(2);

// ASAR: [u32 pickle][u32 headerPickleSize][u32 strLen][u32 pad][header JSON...][data]
// headerPickleSize @4 covers the string pickle; the JSON body starts at offset 16.
const fd = fs.openSync(asarPath, 'r');
const sizeBuf = Buffer.alloc(8);
fs.readSync(fd, sizeBuf, 0, 8, 0);
const headerPickleSize = sizeBuf.readUInt32LE(4);
const base = 8 + headerPickleSize;

const headerBuf = Buffer.alloc(base - 16);
fs.readSync(fd, headerBuf, 0, headerBuf.length, 16);
let json = headerBuf.toString('utf8').replace(/[\0\s]+$/, '');
if (!json.startsWith('{')) {
  throw new Error(`unexpected ASAR header prefix at offset 16: ${JSON.stringify(json.slice(0, 24))}`);
}
const header = JSON.parse(json);
if (!header.files) throw new Error('ASAR header has no "files" key');

const wanted = (p) => !filters.length || filters.some((f) => p.includes(f));

let files = 0, bytes = 0, unpacked = 0, skipped = 0;
const extBySize = [];

function walk(node, prefix) {
  for (const [name, child] of Object.entries(node.files)) {
    const full = prefix ? `${prefix}/${name}` : name;
    if (child.files) walk(child, full);
    else if (child.unpacked) { unpacked++; skipped++; }
    else {
      files++; bytes += child.size;
      extBySize.push([full, child.size]);
      if (wanted(full)) writeOne(full, child);
    }
  }
}

function writeOne(full, node) {
  const dest = path.join(outDir, full);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const buf = Buffer.alloc(node.size);
  fs.readSync(fd, buf, 0, node.size, base + Number(node.offset));
  fs.writeFileSync(dest, buf);
}

walk(header, '');
fs.closeSync(fd);

console.log(`asar files (packed): ${files}  bytes: ${(bytes / 1048576).toFixed(1)} MB`);
console.log(`unpacked entries (skipped, in app.asar.unpacked): ${unpacked}`);
console.log(`headerPickleSize: ${headerPickleSize}  dataBase: ${base}`);
console.log('--- largest packed files ---');
extBySize.sort((a, b) => b[1] - a[1]);
for (const [p, s] of extBySize.slice(0, 20)) console.log(`${(s / 1048576).toFixed(2)} MB  ${p}`);
console.log('--- file counts by top-level dir ---');
const top = {};
for (const [p] of extBySize) { const t = p.split('/')[0]; top[t] = (top[t] || 0) + 1; }
for (const [k, v] of Object.entries(top).sort((a, b) => b[1] - a[1])) console.log(`${String(v).padStart(6)}  ${k}`);