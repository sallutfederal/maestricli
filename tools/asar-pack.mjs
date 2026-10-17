// asar-pack.mjs — empacotador de arquivos ASAR.
//
//   node asar-pack.mjs <dir> <saida.asar> [--order-from <orig.asar>]
//
// Formato (confirmado contra o app.asar do Maestri, 11.639 arquivos):
//
//   offset 0   uint32  4
//   offset 4   uint32  lenJSON + 8
//   offset 8   uint32  lenJSON + 4
//   offset 12  uint32  lenJSON
//   offset 16  bytes   JSON do header
//   offset 16+lenJSON      dados dos arquivos, contiguos, sem alinhamento
//
// Nao ha padding entre o header e os dados: base = 16 + lenJSON.
//
// Entradas com "unpacked": true nao tem "offset" e nao tem dados no arquivo —
// sao lidas de app.asar.unpacked/ pelo Electron em tempo de execucao.
//
// --order-from preserva a ordem exata de arquivos e as flags unpacked/link do
// ASAR original, o que torna a remontagem deterministica.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const BLOCK = 4194304; // 4 MiB, igual ao do ASAR original

// ---------- leitura de um ASAR existente ----------
export function readHeader(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const b = Buffer.alloc(16);
    fs.readSync(fd, b, 0, 16, 0);
    if (b[0] !== 0x7b && b.readUInt32LE(0) !== 4) {
      throw new Error('nao parece um ASAR');
    }
    const headerPickleSize = b.readUInt32LE(4);
    const len = headerPickleSize - 8;
    const hb = Buffer.alloc(len);
    fs.readSync(fd, hb, 0, len, 16);
    return JSON.parse(hb.toString('utf8').replace(/[\0\s]+$/, ''));
  } finally {
    fs.closeSync(fd);
  }
}

// percorre o header em ordem de insercao e devolve [caminho, no]
function flatten(node, prefix, out = []) {
  for (const [name, child] of Object.entries(node.files ?? {})) {
    const full = prefix ? `${prefix}/${name}` : name;
    if (child.files) flatten(child, full, out);
    else out.push([full, child]);
  }
  return out;
}

// ---------- integridade ----------
function integrityOf(absPath, size) {
  const hash = crypto.createHash('sha256');
  const blocks = [];
  const fd = fs.openSync(absPath, 'r');
  try {
    const buf = Buffer.alloc(1 << 20);
    let bh = null, inBlock = 0, read = 0;
    while (read < size) {
      const want = Math.min(buf.length, size - read);
      const n = fs.readSync(fd, buf, 0, want, read);
      if (n <= 0) break;
      hash.update(buf.subarray(0, n));
      let o = 0;
      while (o < n) {
        if (bh === null) { bh = crypto.createHash('sha256'); inBlock = 0; }
        const take = Math.min(BLOCK - inBlock, n - o);
        bh.update(buf.subarray(o, o + take));
        inBlock += take; o += take;
        if (inBlock === BLOCK) { blocks.push(bh.digest('hex')); bh = null; inBlock = 0; }
      }
      read += n;
    }
    if (bh !== null) blocks.push(bh.digest('hex'));
  } finally {
    fs.closeSync(fd);
  }
  return { algorithm: 'SHA256', hash: hash.digest('hex'), blockSize: BLOCK, blocks };
}

// ---------- montagem da arvore ----------
function insert(tree, parts, entry) {
  let node = tree;
  for (let i = 0; i < parts.length - 1; i++) {
    const d = parts[i];
    if (!node.files[d]) node.files[d] = { files: {} };
    else if (!node.files[d].files) node.files[d] = { files: {} };
    node = node.files[d];
  }
  node.files[parts[parts.length - 1]] = entry;
}

function pack(srcDir, outFile, orderFile) {
  const src = path.resolve(srcDir);
  const tree = { files: {} };

  // ordem e flags originais
  let order = null;
  if (orderFile) {
    const orig = readHeader(orderFile);
    order = new Map(flatten(orig));
  }

  // arquivos presentes no disco, em ordem alfabetica (deterministico)
  const present = [];
  (function walk(dir, prefix) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const e of entries) {
      const full = prefix ? `${prefix}/${e.name}` : e.name;
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) {
        present.push([full, null]);
        walk(abs, full);
      } else if (e.isFile()) {
        present.push([full, abs]);
      }
      // symlinks sao ignorados: o ASAR original nao usa link
    }
  })(src, '');

  const filePaths = present.filter(([, a]) => a !== null);

  // ordem: se ha ASAR de referencia, segue a ordem original e herda as flags
  // unpacked/link. Arquivos novos (que nao existiam no original) vao ao fim.
  const onDisk = new Map(filePaths);
  let seq;
  if (order) {
    seq = [];
    const used = new Set();
    for (const [rel, node] of order) {
      if (!onDisk.has(rel)) continue;      // nao existe mais na arvore editada
      seq.push([rel, onDisk.get(rel), node]);
      used.add(rel);
    }
    for (const [rel, abs] of filePaths) {
      if (!used.has(rel)) seq.push([rel, abs, null]);
    }
  } else {
    seq = filePaths.map(([rel, abs]) => [rel, abs, null]);
  }

  // calcula offsets e monta o header
  let offset = 0;
  const manifest = [];
  for (const [rel, abs, orig] of seq) {
    const st = fs.statSync(abs);
    const entry = { size: st.size };
    const unpacked = !!(orig && orig.unpacked);
    const isLink = !!(orig && orig.link);

    if (isLink) {
      entry.link = orig.link;
    } else if (unpacked) {
      entry.unpacked = true;
    } else {
      entry.offset = String(offset);
      offset += st.size;
    }
    entry.integrity = integrityOf(abs, st.size);
    manifest.push([rel, abs, entry]);
    insert(tree, rel.split('/'), entry);
  }

  // ---------- serializacao ----------
  const json = JSON.stringify(tree);
  const len = Buffer.byteLength(json, 'utf8');
  const headerPickleSize = len + 8;

  const head = Buffer.alloc(16);
  head.writeUInt32LE(4, 0);
  head.writeUInt32LE(headerPickleSize, 4);
  head.writeUInt32LE(len + 4, 8);
  head.writeUInt32LE(len, 12);

  const out = fs.createWriteStream(outFile);
  const done = new Promise((res, rej) => {
    out.on('error', rej);
    out.on('finish', res);
  });

  out.write(head);
  out.write(json, 'utf8');

  const base = 16 + len;
  let dataBytes = 0;
  for (const [, abs, entry] of manifest) {
    if (entry.unpacked || entry.link) continue;
    if (Number(entry.offset) !== dataBytes) {
      throw new Error(`offset inconsistente em ${abs}`);
    }
    out.write(fs.readFileSync(abs));
    dataBytes += entry.size;
  }

  out.end();
  return done.then(() => ({
    file: outFile,
    base,
    files: manifest.length,
    packed: manifest.filter(([, , e]) => !e.unpacked && !e.link).length,
    unpacked: manifest.filter(([, , e]) => e.unpacked).length,
    bytes: base + dataBytes,
  }));
}

// ---------- CLI ----------
if (process.argv[1] && process.argv[1].endsWith('asar-pack.mjs')) {
  const [dir, out] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const oi = process.argv.indexOf('--order-from');
  const orderFrom = oi >= 0 ? process.argv[oi + 1] : null;

  if (!dir || !out) {
    console.error('uso: node asar-pack.mjs <dir> <saida.asar> [--order-from <orig.asar>]');
    process.exit(1);
  }

  const t0 = Date.now();
  pack(dir, out, orderFrom).then((r) => {
    console.log(`origem        : ${path.resolve(dir)}`);
    console.log(`saida         : ${r.file}`);
    if (orderFrom) console.log(`ordem/filtros : ${orderFrom}`);
    console.log(`arquivos      : ${r.files}  (packed ${r.packed}, unpacked ${r.unpacked})`);
    console.log(`header base   : ${r.base}`);
    console.log(`tamanho total : ${r.bytes.toLocaleString('pt-BR')} bytes`);
    console.log(`tempo         : ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }).catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
}