// Analisador PE/ELF para reversing nativo estatico.
//   node native-pe.mjs <arquivo>
//
// Foco em binarios Swift: as secoes __swift5_* e .swift1_autolink contem
// nomes mangled e metadados de reflexao em texto claro, mesmo sem stripped.
import fs from 'node:fs';

const file = process.argv[2];
const buf = fs.readFileSync(file);
const isElf = buf[0] === 0x7f && buf.toString('latin1', 1, 4) === 'ELF';

const sections = [];
let peBase = null, peMachine = null, peSubsystem = null, peTimestamp = null;
let entry = null, imageBase = null;

if (!isElf) {
  const e = buf.readUInt32LE(0x3c);
  if (buf.toString('latin1', e, e + 4) !== 'PE\0\0') throw new Error('nao e PE');
  const coff = e + 4;
  peMachine = buf.readUInt16LE(coff);
  const nsec = buf.readUInt16LE(coff + 2);
  peTimestamp = buf.readUInt32LE(coff + 4);
  const optsz = buf.readUInt16LE(coff + 16);
  const opt = coff + 20;
  const magic = buf.readUInt16LE(opt);
  peSubsystem = buf.readUInt16LE(opt + 68);
  if (magic === 0x20b) imageBase = buf.readBigUInt64LE(opt + 24);
  else imageBase = BigInt(buf.readUInt32LE(opt + 28));
  entry = imageBase + BigInt(buf.readUInt32LE(opt + 16));
  const st = opt + optsz;
  for (let i = 0; i < nsec; i++) {
    const o = st + 40 * i;
    sections.push({
      name: buf.toString('latin1', o, o + 8).replace(/\0+$/, ''),
      vsize: buf.readUInt32LE(o + 8),
      vaddr: buf.readUInt32LE(o + 12),
      rawsize: buf.readUInt32LE(o + 16),
      rawoff: buf.readUInt32LE(o + 20),
      chars: buf.readUInt32LE(o + 36),
    });
  }
  peBase = BigInt(imageBase);
} else {
  const is64 = buf[4] === 2;
  const shoff = Number(is64 ? buf.readBigUInt64LE(0x28) : buf.readUInt32LE(0x20));
  const shentsize = buf.readUInt16LE(0x3a);
  const shnum = buf.readUInt16LE(0x3c);
  const shstrndx = buf.readUInt16LE(0x3e);
  const strHdr = shoff + shstrndx * shentsize;
  const strOff = Number(is64 ? buf.readBigUInt64LE(strHdr + 0x18) : buf.readUInt32LE(strHdr + 0x10));
  entry = is64 ? buf.readBigUInt64LE(0x18) : BigInt(buf.readUInt32LE(0x18));
  for (let i = 0; i < shnum; i++) {
    const o = shoff + i * shentsize;
    // sh_name e um offset dentro de .shstrtab: le ate o terminador NUL
    const nameOff = strOff + buf.readUInt32LE(o);
    let end = nameOff;
    while (end < buf.length && buf[end] !== 0) end++;
    sections.push({
      name: buf.toString('latin1', nameOff, end),
      // ELF64 shdr: 0x10 sh_addr, 0x18 sh_offset, 0x20 sh_size, 0x38 sh_entsize
      vaddr: Number(is64 ? buf.readBigUInt64LE(o + 0x10) : buf.readUInt32LE(o + 0x0c)),
      rawoff: Number(is64 ? buf.readBigUInt64LE(o + 0x18) : buf.readUInt32LE(o + 0x10)),
      rawsize: Number(is64 ? buf.readBigUInt64LE(o + 0x20) : buf.readUInt32LE(o + 0x14)),
      vsize: Number(is64 ? buf.readBigUInt64LE(o + 0x20) : buf.readUInt32LE(o + 0x14)),
      chars: buf.readUInt32LE(o + 0x24),
    });
  }
}

// ---- strings ASCII sequenciais ----
function strings(bytes, min = 6) {
  const out = [];
  let cur = '', start = 0;
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    if (c >= 0x20 && c < 0x7f) {
      if (!cur) start = i;
      cur += String.fromCharCode(c);
    } else {
      if (cur.length >= min) out.push({ s: cur, off: start });
      cur = '';
    }
  }
  if (cur.length >= min) out.push({ s: cur, off: start });
  return out;
}

// Swift no Windows usa .sw5* ; em ELF/macOS usa swift5_* ou __swift5_* ; autolink em .swift1_autolink
const SWIFT_SEC = /^(?:\.sw5|swift5_|__swift5|\.swiftsyms|\.swift1_autolink)/;
const isSwiftSec = (n) => SWIFT_SEC.test(n);

const all = strings(buf, 6);

// ---- simbolos Swift ($s / _$s / $S / _T0) ----
const swift = all.filter((x) => /(^|[^A-Za-z0-9_])[_\$]{0,2}\$s[A-Za-z0-9_$]/.test(x.s) || /\$[ST]0?$/.test(x.s));

// ---- agrupar por namespace Swift ----
function nsOf(sym) {
  const m = sym.match(/\$s([0-9A-Za-z_]+)([A-Za-z0-9_$]*)/);
  if (!m) return null;
  const rest = m[2] || '';
  const parts = rest.match(/[A-Za-z_][A-Za-z0-9_]{2,}/g);
  return parts ? parts.slice(0, 3).join('::') : null;
}
const nsMap = new Map();
for (const x of swift) {
  const ns = nsOf(x.s);
  if (ns) nsMap.set(ns, (nsMap.get(ns) || 0) + 1);
}

console.log(`arquivo      : ${file}`);
console.log(`tamanho      : ${buf.length.toLocaleString('pt-BR')} bytes`);
console.log(`formato      : ${isElf ? 'ELF' : 'PE'}`);
if (!isElf) {
  console.log(`machine      : 0x${peMachine.toString(16).padStart(4, '0')}${peMachine === 0x8664 ? ' (x86-64)' : peMachine === 0x14c ? ' (x86)' : ''}`);
  console.log(`subsystem    : ${peSubsystem} (${peSubsystem === 3 ? 'console' : peSubsystem === 2 ? 'GUI' : '?'})`);
  console.log(`timestamp    : ${new Date(peTimestamp * 1000).toISOString()}`);
  console.log(`image base   : 0x${peBase.toString(16)}`);
  console.log(`entry point  : 0x${entry.toString(16)}`);
}
console.log(`\n=== secoes (${sections.length}) ===`);
const bySize = [...sections].sort((a, b) => b.rawsize - a.rawsize);
for (const s of bySize) {
  const tag = isSwiftSec(s.name) ? '  <-- swift metadata' : '';
  console.log(
    `${s.name.padEnd(24)} vsize=${String(s.vsize).padStart(10)} raw=${String(s.rawsize).padStart(10)} off=0x${s.rawoff.toString(16).padStart(8, '0')}${tag}`
  );
}

const swiftSecs = sections.filter((s) => isSwiftSec(s.name));
console.log(`\n=== secoes Swift: ${swiftSecs.length}, ${swiftSecs.reduce((a, s) => a + s.rawsize, 0).toLocaleString('pt-BR')} bytes ===`);

console.log(`\n=== simbolos Swift (mangled, texto claro): ${swift.length} ===`);
const top = [...nsMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
for (const [ns, n] of top) console.log(`  ${String(n).padStart(6)}  ${ns}`);

fs.writeFileSync(process.argv[3] ?? 'native-strings.json', JSON.stringify({
  file, size: buf.length, format: isElf ? 'ELF' : 'PE',
  pe: isElf ? null : { machine: peMachine, subsystem: peSubsystem, timestamp: peTimestamp, imageBase: String(peBase), entry: String(entry) },
  sections: sections.map((s) => ({ ...s })),
  swift_section_bytes: swiftSecs.reduce((a, s) => a + s.rawsize, 0),
  swift_symbol_count: swift.length,
  swift_symbols: swift.map((x) => x.s),
  swift_namespaces: [...nsMap.entries()].sort((a, b) => b[1] - a[1]).map(([ns, n]) => ({ ns, count: n })),
  strings: all.map((x) => x.s),
}, null, 2));
console.log(`\n-> strings + simbolos salvos em ${process.argv[3] ?? 'native-strings.json'}`);