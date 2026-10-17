// swift-reflect.mjs — decoder de metadados de reflexao do Swift.
//
// Le a secao de descritores de campo (swift5_fieldmd / .sw5flmd) e reconstroi
// as definicoes de struct/class/enum com nome e tipo de cada campo.
//
// Formato (swift/include/swift/Runtime/Metadata.h):
//
//   TargetFieldDescriptor {
//     int32   MangledTypeName;   // ponteiro relativo
//     int32   Superclass;        // ponteiro relativo
//     uint16  Kind;              // FieldDescriptorKind
//     uint16  FieldRecordSize;
//     uint32  NumFields;
//   }   seguido por NumFields registros
//
//   TargetFieldRecord {
//     int32   Flags;             // bit 0 = IsIndirect
//     int32   MangledTypeName;   // ponteiro relativo
//     int32   FieldName;         // ponteiro relativo
//   }
//
// Os registros de campo ficam entre o descritor e o proximo descritor, entao o
// avanco e  16 + NumFields * FieldRecordSize  (passo fixo desalinha).
//
// Ponteiro relativo: base e o endereco do proprio campo. Em ELF o valor e um
// deslocamento de endereco virtual; a base do binario e constante, entao
// target_arquivo = posicao_do_campo + int32.
//
// Referencia indireta: quando o ponteiro cai numa entrada de swift5_typeref,
// a string esta depois de um cabecalho de 8 bytes. Em vez de assumir o
// cabecalho, o leitor usa um indice de todas as strings mangled do binario e
// avanca ate o inicio da string valida mais proxima.

import fs from 'node:fs';
import { demangle } from './swift-demangle.mjs';

const KIND = ['struct', 'class', 'enum', 'multi-payload enum', 'protocol',
  'class protocol', 'objc protocol', 'objc class'];

export function readSections(buf) {
  const secs = new Map();
  if (buf[0] === 0x7f && buf.toString('latin1', 1, 4) === 'ELF') {
    const is64 = buf[4] === 2;
    const shoff = Number(is64 ? buf.readBigUInt64LE(0x28) : buf.readUInt32LE(0x20));
    const shentsize = buf.readUInt16LE(0x3a);
    const shnum = buf.readUInt16LE(0x3c);
    const shstrndx = buf.readUInt16LE(0x3e);
    const strHdr = shoff + shstrndx * shentsize;
    const strOff = Number(is64 ? buf.readBigUInt64LE(strHdr + 0x18) : buf.readUInt32LE(strHdr + 0x10));
    for (let i = 0; i < shnum; i++) {
      const o = shoff + i * shentsize;
      const nameOff = strOff + buf.readUInt32LE(o);
      let e = nameOff; while (e < buf.length && buf[e] !== 0) e++;
      secs.set(buf.toString('latin1', nameOff, e), {
        off: Number(is64 ? buf.readBigUInt64LE(o + 0x18) : buf.readUInt32LE(o + 0x10)),
        size: Number(is64 ? buf.readBigUInt64LE(o + 0x20) : buf.readUInt32LE(o + 0x14)),
        vaddr: Number(is64 ? buf.readBigUInt64LE(o + 0x10) : buf.readUInt32LE(o + 0x0c)),
      });
    }
  } else {
    const e = buf.readUInt32LE(0x3c);
    const coff = e + 4;
    const nsec = buf.readUInt16LE(coff + 2);
    const optsz = buf.readUInt16LE(coff + 16);
    const st = coff + 20 + optsz;
    for (let i = 0; i < nsec; i++) {
      const o = st + 40 * i;
      let e2 = o; while (e2 < o + 8 && buf[e2] !== 0) e2++;
      secs.set(buf.toString('latin1', o, e2), {
        off: buf.readUInt32LE(o + 20),
        size: buf.readUInt32LE(o + 16),
        vaddr: buf.readUInt32LE(o + 12),
      });
    }
  }
  return secs;
}

function cstr(buf, off, max = 400) {
  if (off < 0 || off >= buf.length) return null;
  let e = off;
  while (e < buf.length && e - off < max && buf[e] !== 0) e++;
  return e === off ? null : buf.toString('utf8', off, e);
}

// indice de nomes mangled do binario. Um mangling sempre contem digitos de
// tamanho, entao "$s" + [A-Za-z0-9] + pelo menos um digito e o criterio.
function buildStringIndex(buf) {
  const starts = [];
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] !== 0x24 /* '$' */) continue;
    const n = buf[i + 1];
    if (n !== 0x73 /* 's' */ && n !== 0x53 /* 'S' */) continue;
    const c = buf[i + 2];
    const alnum = (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a);
    if (!alnum) continue;
    let e = i;
    while (e < buf.length && e - i < 400 && buf[e] !== 0) e++;
    const s = buf.toString('latin1', i, e);
    if (s.length > 5 && /^\$[sS][A-Za-z]/.test(s) && /\d/.test(s)) starts.push(i);
    i = e;
  }
  starts.sort((a, b) => a - b);
  return starts;
}

// Calibra o deslocamento entre o alvo do ponteiro relativo e o inicio da
// string mangled. Percorre os FieldRecords, resolve o tipo com cada candidato
// e Pontua: um nome bem resolvido contem letras E nao e identico ao mangled.
function calibrateSnapOffset(buf, fd, idx, maxSamples = 4000) {
  const readI32 = (o) => (o + 4 <= buf.length ? buf.readInt32LE(o) : 0);
  const readU16 = (o) => (o + 2 <= buf.length ? buf.readUInt16LE(o) : 0);
  const readU32 = (o) => (o + 4 <= buf.length ? buf.readUInt32LE(o) : 0);

  // coleta amostras: [alvoBruto] dos MangledTypeName de campo
  const samples = [];
  let p = fd.off;
  const end = fd.off + fd.size;
  while (p + 16 <= end && samples.length < maxSamples) {
    const kind = readU16(p + 8);
    const recSize = readU16(p + 10);
    const numFields = readU32(p + 12);
    if (kind > 7 || recSize < 8 || recSize > 64 || numFields > 4096) { p += 4; continue; }
    for (let i = 0; i < numFields && samples.length < maxSamples; i++) {
      const r = p + 16 + i * recSize;
      if (r + recSize > buf.length) break;
      samples.push(r + 4 + readI32(r + 4));
    }
    p += 16 + numFields * recSize;
  }

  const CANDIDATES = [-24, -20, -16, -12, -10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10, 12, 16];
  let best = 0, bestScore = -1;
  for (const off of CANDIDATES) {
    // Pontua por DIVERSIDADE: um deslocamento errado colapsa todas as
    // amostras na mesma string (score ~1 distinct). O correto espalha os
    // resultados pelos tipos realmente referenciados.
    const seen = new Set();
    let resolved = 0;
    for (const t of samples) {
      const want = t + off;
      let lo = 0, hi = idx.length - 1, bi = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (idx[mid] <= want) { bi = mid; lo = mid + 1; } else hi = mid - 1;
      }
      if (bi < 0) continue;
      const s = cstr(buf, idx[bi]);
      if (!s) continue;
      seen.add(s);
      resolved++;
    }
    if (resolved < 20) continue;
    // razao de strings distintas por amostra (0..1) * resolvidas
    const score = (seen.size / resolved) * resolved;
    if (score > bestScore) { bestScore = score; best = off; }
  }
  return best;
}

export function decodeFields(buf, opts = {}) {
  const secs = readSections(buf);
  let fieldKey = null;
  for (const k of secs.keys()) if (/fieldmd|sw5flmd/.test(k)) { fieldKey = k; break; }
  if (!fieldKey) throw new Error('secao de descritores de campo nao encontrada');
  const fd = secs.get(fieldKey);

  const idx = buildStringIndex(buf);
  // Entradas de swift5_typeref sao [cabecalho de 8 bytes] + string mangled.
  // O ponteiro relativo cai dentro da entrada, entao o inicio da string fica
  // um deslocacao fixa a frente do alvo. Esse deslocamento varia com o
  // layout emitido pelo compilador, entao e CALIBRADO por medicao: testa-se
  // cada candidato e fica o que produz mais nomes de tipo bem resolvidos.
  // Ver calibrateSnapOffset() abaixo.
  const buildSnap = (off) => (target) => {
    const want = target + off;
    let lo = 0, hi = idx.length - 1, best = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (idx[mid] <= want) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return best >= 0 ? idx[best] : -1;
  };
  let snap = buildSnap(0);
  if (opts.snapOffset === undefined) {
    snap = buildSnap(calibrateSnapOffset(buf, fd, idx));
  } else {
    snap = buildSnap(opts.snapOffset);
  }

  const readI32 = (o) => (o + 4 <= buf.length ? buf.readInt32LE(o) : 0);
  const readU16 = (o) => (o + 2 <= buf.length ? buf.readUInt16LE(o) : 0);
  const readU32 = (o) => (o + 4 <= buf.length ? buf.readUInt32LE(o) : 0);

  const out = [];
  const limit = opts.limit ?? 200000;
  let bad = 0;
  let p = fd.off;
  const end = fd.off + fd.size;

  while (p + 16 <= end && out.length < limit) {
    const kind = readU16(p + 8);
    const recSize = readU16(p + 10);
    const numFields = readU32(p + 12);
    if (kind > 7 || recSize < 8 || recSize > 64 || numFields > 4096) { bad++; p += 4; continue; }
    if (p + 16 + numFields * recSize > buf.length) break;

    const typeName = cstr(buf, snap(p + readI32(p)));
    if (!typeName) { p += 16; continue; }

    const fields = [];
    for (let i = 0; i < numFields; i++) {
      const r = p + 16 + i * recSize;
      if (r + recSize > buf.length) break;
      const flags = readI32(r);

      // FieldName e ponteiro DIRETO para texto simples em swift5_reflstr
      // (nome do campo: "nonce", "key", ...). Nao precisa de snap.
      const fname = cstr(buf, r + 8 + readI32(r + 8));
      if (fname !== null && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(fname)) continue;

      // MangledTypeName atravessa uma referencia indireta em swift5_typeref
      // cujo encoding (cabecalho + ponteiro encadeado) nao esta totalmente
      // implementado. A resolucao por ajuste de deslocamento colapsa quase
      // todos os campos na mesma string, entao NAO e reportada: devolver um
      // tipo errado e pior que devolver nenhum. Use o nome mangled bruto.
      const mang = cstr(buf, snap(r + 4 + readI32(r + 4)));

      fields.push({
        name: fname ?? '?',
        mangled: mang,
        type: null,
        indirect: (flags & 1) === 1,
      });
    }

    out.push({ mangled: typeName, name: typeName, kind: KIND[kind], fields });
    p += 16 + numFields * recSize;
  }

  return { section: fieldKey, total: out.length, skipped: bad, types: out };
}

if (process.argv[1] && process.argv[1].endsWith('swift-reflect.mjs')) {
  const file = process.argv[2];
  const buf = fs.readFileSync(file);
  const res = decodeFields(buf);

  // metricas honestas de cobertura
  let fields = 0, named = 0;
  const withMangled = 0;
  for (const t of res.types) {
    for (const f of t.fields) {
      fields++;
      if (f.name && f.name !== '?') named++;
    }
  }

  console.log(`arquivo             : ${file}`);
  console.log(`secao de campos     : ${res.section}`);
  console.log(`tipos decodificados : ${res.total}`);
  console.log(`campos              : ${fields}`);
  console.log(`  nomes resolvidos  : ${named} (${((named / fields) * 100).toFixed(1)}%)`);
  console.log(`  tipos resolvidos  : 0 (nao implementado — ver docs/04-SWIFT.md)`);
  console.log('');

  const only = process.argv[3];
  const types = only ? res.types.filter((t) => (t.name ?? '').includes(only)) : res.types;
  for (const t of types) {
    console.log(`${t.kind} ${t.mangled}`);
    if (!t.fields.length) console.log('    (sem campos nomeados)');
    for (const f of t.fields) {
      console.log(`    var ${f.name}${f.indirect ? '  [indirect]' : ''}`);
    }
    console.log();
  }
  if (process.argv[4]) {
    fs.writeFileSync(process.argv[4], JSON.stringify(res, null, 2));
    console.log(`-> ${process.argv[4]}`);
  }
}