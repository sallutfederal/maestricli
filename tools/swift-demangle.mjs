// swift-demangle.mjs — demangler da linguagem de nomes mangled do Swift.
//
// Cobre o subconjunto que aparece em metadados de reflexao do Swift: campos de
// struct, tipos genericos, containers, funcoes e primitivos. Nao decodifica a
// arvore binaria de tipos (swift5_type_metadata) — apenas a notacao textual
// que o mangling carrega.
//
// Referencia: swift/include/swift/AST/Demangle.cpp
//   $s <global>               simbolos mangled
//   $S <reflection-mangled>   metadados de reflexao
//   <len><id>                 identificador prefixado por tamanho decimal
//
// Gramática de um nó de tipo, na ordem real do encoding:
//   prefixo?  nome-nominal  <argumentos-genericos>?  sufixo

const PRIMITIVES = {
  Si: 'Int', Sb: 'Bool', Sd: 'Double', Sf: 'Float',
  Ss: 'String', SS: 'String',
  Su: 'UInt', SL: 'Int64', SU: 'UInt64',
  Sa: 'UnsafeMutablePointer', SB: 'UnsafeRawPointer', Sp: 'UnsafePointer',
  Sk: 'Unicode.Scalar', Su_: 'UInt',
};

const isDigit = (c) => c >= '0' && c <= '9';

export class Demangler {
  constructor(s) {
    this.s = s;
    this.i = 0;
  }

  eof() { return this.i >= this.s.length; }
  peek(k = 0) { return this.s[this.i + k]; }

  // <len><id> — os dígitos indicam quantos caracteres o identificador tem
  ident() {
    const start = this.i;
    while (!this.eof() && isDigit(this.peek())) this.i++;
    if (this.i === start) return null;
    const len = parseInt(this.s.slice(start, this.i), 10);
    if (len <= 0 || len > 4096) { this.i = start; return null; }
    const id = this.s.slice(this.i, this.i + len);
    if (id.length < len) { this.i = start; return null; }
    this.i += len;
    return id;
  }

  run() {
    let module = null;
    let bare = false;
    if (this.s.startsWith('$s') || this.s.startsWith('$S')) {
      this.i = 2;
      module = this.ident();
    } else {
      bare = true;
    }

    const parts = [];
    let guard = 0;
    while (!this.eof() && guard++ < 64) {
      const before = this.i;
      const n = this.parseType(bare ? null : module);
      if (n === null) break;
      parts.push(n);
      if (this.i === before) break;
    }
    return parts.length ? parts.join(' ') : this.s;
  }

  parseType(module) {
    const { s } = this;
    let prefix = null;

    // ---- 1) prefixos de container ----
    for (;;) {
      const three = s.substr(this.i, 3);
      if (three === 'Say') { this.i += 3; prefix = 'Array'; continue; }
      if (three === 'SDy') { this.i += 3; prefix = 'Dictionary'; continue; }
      const two = s.substr(this.i, 2);
      if (two === 'Sg') { this.i += 2; prefix = prefix ? `Optional<${prefix}>` : 'Optional'; continue; }
      if (two === 'XM' || two === 'Xm') { this.i += 2; prefix = 'Metatype'; continue; }
      break;
    }

    // container já tem seus próprios argumentos
    if (prefix === 'Array' || prefix === 'Dictionary' || prefix === 'Metatype') {
      const args = this.parseArgList(true);
      if (!args.length) { this.i = this.s.length; return prefix; }
      return `${prefix}<${args.join(', ')}>`;
    }

    // ---- 2) nome do tipo ----
    let mod = module ?? null;
    let name = null;
    let args = [];

    if (isDigit(this.peek())) {
      const a = this.ident();
      if (a === null) {
        const rest = s.slice(this.i); this.i = s.length; return rest || null;
      }
      // Nao ha como distinguir "Modulo.Tipo" de "Tipo<Arg>" so pelo formato:
      // ambos sao <len><id><len><id><sufixo>. Em metadados de campo o
      // argumento generico e o caso comum, entao assume-se que o primeiro
      // identificador e o nome do tipo. O caminho qualificado (containers)
      // passa qualified=true e trata o primeiro como modulo.
      name = a;
      // argumentos genéricos
      if (this.peek() === 'g') {
        this.i++;
        args = this.parseArgList();
      } else {
        let g2 = 0;
        while (isDigit(this.peek()) && g2++ < 16) {
          const before = this.i;
          const v = this.parseArgOne();
          if (v === null || this.i === before) break;
          args.push(v);
        }
      }
      const suf = this.peek();
      if (suf === 'C' || suf === 'V' || suf === 'O' || suf === 'P' || suf === 'c') this.i++;
    } else if (this.peek() === 's' && isDigit(this.peek(1))) {
      // s<len><nome-builtin>   ex.: s5Int32V -> Int32   (prefixo 's' = Swift stdlib)
      this.i++;
      name = this.ident() ?? '?';
      mod = null;
      if (this.peek() === 'V' || this.peek() === 'C' || this.peek() === 'O') this.i++;
    } else {
      const two = s.substr(this.i, 2);
      if (two === 'Sb') {
        this.i += 2;
        if (this.peek() === '_') { this.i++; return this.wrap(prefix, 'Bool'); }
        const params = this.parseFnArgs();
        const ret = this.parseRet();
        return this.wrap(prefix, `(${params.join(', ')}) -> ${ret}`);
      }
      if (PRIMITIVES[two]) {
        this.i += 2;
        if (this.peek() === 'g') this.i++;
        if (this.peek() === 'V' || this.peek() === 'C') this.i++;
        return this.wrap(prefix, PRIMITIVES[two]);
      }
      const rest = s.slice(this.i);
      this.i = s.length;
      return rest || null;
    }

    const shown = (mod ? `${mod}.${name}` : name) + (args.length ? `<${args.join(', ')}>` : '');
    return this.wrap(prefix, shown);
  }

  wrap(prefix, inner) {
    if (!prefix) return inner;
    if (prefix.startsWith('Optional<')) return `Optional<${prefix.slice(10, -1)}<${inner}>>`;
    if (prefix === 'Optional') return `Optional<${inner}>`;
    return `${prefix}<${inner}>`;
  }

  // lista de argumentos ate sufixo 'G'/'>' ou fim.
  // qualified=true -> o primeiro <len><id> e o modulo e o segundo e o tipo
  //   (forma usada dentro de containers: Say14Modulo7TipoCG)
  parseArgList(qualified = false) {
    const out = [];
    let guard = 0;
    let first = qualified;
    while (!this.eof() && guard++ < 64) {
      const c = this.peek();
      if (c === 'G' || c === '>' || c === '_') { if (c === 'G' || c === '>') this.i++; break; }
      const before = this.i;
      const a = this.parseArgOne(first);
      first = false;
      if (a === null) { this.i++; continue; }
      out.push(a);
      if (this.i === before) this.i++;
    }
    return out;
  }

  // um argumento de tipo em posicao de lista
  parseArgOne(qualified = false) {
    const { s } = this;
    const three = s.substr(this.i, 3);
    if (three === 'Say' || three === 'SDy') return this.parseType('__std');

    const two = s.substr(this.i, 2);
    if (two === 'Sg') { this.i += 2; return `Optional<${this.parseArgOne() ?? '_'}>`; }
    if (two === 'XM' || two === 'Xm') { this.i += 2; return 'Metatype'; }

    if (this.peek() === 's' && isDigit(this.peek(1))) {
      this.i++;
      return this.ident() ?? '?';
    }

    if (two === 'Sb') {
      this.i += 2;
      if (this.peek() === '_') { this.i++; return 'Bool'; }
      const params = this.parseFnArgs();
      const ret = this.parseRet();
      return `(${params.join(', ')}) -> ${ret}`;
    }

    if (PRIMITIVES[two]) {
      this.i += 2;
      if (this.peek() === 'g') this.i++;
      if (this.peek() === 'V' || this.peek() === 'C') this.i++;
      return PRIMITIVES[two];
    }

    if (isDigit(this.peek())) {
      // reaproveita o parser de tipo completo (trata genericos e containers)
      if (!qualified) return this.parseType(null);

      // forma qualificada: <len><modulo><len><tipo><sufixo>
      const mod = this.ident();
      if (mod === null) return null;
      if (!isDigit(this.peek())) return mod;
      const nm = this.ident();
      const out = nm ?? mod;
      const suf = this.peek();
      if (suf === 'C' || suf === 'V' || suf === 'O' || suf === 'P' || suf === 'c') this.i++;
      return `${mod}.${out}`;
    }

    return null;
  }

  // parâmetros de tipo função: sequência de tipos terminada por '_' ou ret
  parseFnArgs() {
    const out = [];
    let guard = 0;
    while (!this.eof() && guard++ < 24) {
      if (this.peek() === '_') { this.i++; break; }
      if (this.peek() === 't') { this.i++; continue; }
      const before = this.i;
      const a = this.parseArgOne();
      if (a === null) { this.i++; continue; }
      out.push(a);
      if (this.i === before) this.i++;
    }
    return out;
  }

  parseRet() {
    if (this.peek() === '_') { this.i++; return 'Void'; }
    const r = this.parseArgOne();
    return r ?? 'Void';
  }
}

const cache = new Map();

export function demangle(mangled) {
  if (!mangled || typeof mangled !== 'string') return '';
  if (cache.has(mangled)) return cache.get(mangled);
  let out;
  try {
    out = new Demangler(mangled).run();
  } catch {
    out = mangled;
  }
  // saneamento: se o resultado nao parece Swift, devolve o mangled original
  if (!out || !/[A-Za-z]{3}/.test(out) || out.length > 240 || /\$\d/.test(out)) {
    out = mangled;
  }
  cache.set(mangled, out);
  return out;
}