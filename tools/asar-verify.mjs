// asar-verify.mjs — compara dois arquivos ASAR entrada a entrada.
//
//   node asar-verify.mjs <original.asar> <reproduzido.asar>
//
// Confere o conjunto de caminhos, o tamanho de cada um e o SHA-256 do conteudo.
import fs from 'node:fs';
import crypto from 'node:crypto';

function readAsar(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const b = Buffer.alloc(16);
    fs.readSync(fd, b, 0, 16, 0);
    const len = b.readUInt32LE(4) - 8;
    const hb = Buffer.alloc(len);
    fs.readSync(fd, hb, 0, len, 16);
    const hdr = JSON.parse(hb.toString('utf8').replace(/[\0\s]+$/, ''));
    return { fd, hdr, base: 16 + len };
  } catch (e) { fs.closeSync(fd); throw e; }
}

function flatten(node, prefix, out = []) {
  for (const [name, child] of Object.entries(node.files ?? {})) {
    const full = prefix ? `${prefix}/${name}` : name;
    if (child.files) flatten(child, full, out);
    else out.push([full, child]);
  }
  return out;
}

function shaOf(fd, base, entry) {
  if (entry.unpacked || entry.link) return null; // fora do container
  const h = crypto.createHash('sha256');
  const size = entry.size;
  const CHUNK = 1 << 22;
  const buf = Buffer.alloc(Math.min(CHUNK, Math.max(size, 1)));
  let read = 0;
  while (read < size) {
    const want = Math.min(CHUNK, size - read);
    const n = fs.readSync(fd, buf, 0, want, base + Number(entry.offset) + read);
    if (n <= 0) break;
    h.update(buf.subarray(0, n));
    read += n;
  }
  return h.digest('hex');
}

const [f1, f2] = process.argv.slice(2);
const A = readAsar(f1);
const B = readAsar(f2);

const ma = new Map(flatten(A.hdr));
const mb = new Map(flatten(B.hdr));

console.log(`original   : ${f1}`);
console.log(`reproduzido: ${f2}`);
console.log(`\nentradas  original=${ma.size}  reproduzido=${mb.size}`);

const so = new Set(ma.keys()), sr = new Set(mb.keys());
const soResta = [...so].filter((k) => !sr.has(k));
const srNovo = [...sr].filter((k) => !so.has(k));
if (soResta.length) console.log(`\nSOMENTE NO ORIGINAL (${soResta.length}):`);
for (const k of soResta.slice(0, 20)) console.log(`  - ${k}`);
if (srNovo.length) console.log(`\nSOMENTE NO REPRODUZIDO (${srNovo.length}):`);
for (const k of srNovo.slice(0, 20)) console.log(`  + ${k}`);

let same = 0, diffSize = 0, diffHash = 0, un = 0, skipped = 0;
const problemas = [];
for (const [k, ea] of ma) {
  const eb = mb.get(k);
  if (!eb) { skipped++; continue; }
  if (ea.unpacked || ea.link || eb.unpacked || eb.link) { un++; continue; }
  if (ea.size !== eb.size) {
    diffSize++;
    if (problemas.length < 25) problemas.push(`tamanho ${k}: ${ea.size} -> ${eb.size}`);
    continue;
  }
  const ha = shaOf(A.fd, A.base, ea);
  const hb = shaOf(B.fd, B.base, eb);
  if (ha === hb) same++;
  else { diffHash++; if (problemas.length < 25) problemas.push(`hash ${k}`); }
}

console.log(`\nconteudo identico   : ${same}`);
console.log(`hash diferente      : ${diffHash}`);
console.log(`tamanho diferente   : ${diffSize}`);
console.log(`unpacked/link       : ${un}`);
console.log(`ausentes no reproduzido: ${skipped}`);
if (problemas.length) { console.log('\nproblemas:'); for (const p of problemas) console.log('  ' + p); }

const ok = diffHash === 0 && diffSize === 0 && soResta.length === 0 && srNovo.length === 0;
console.log(`\nRESULTADO: ${ok ? 'IDENTICO' : 'DIVERGENTE'}`);

fs.closeSync(A.fd); fs.closeSync(B.fd);
process.exit(ok ? 0 : 1);