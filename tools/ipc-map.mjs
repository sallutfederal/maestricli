// Mapeia os canais IPC declarados no preload para suas implementacoes no main.
//   node ipc-map.mjs <preload.js> <main.js> <saida.json> <saida.md>
//
// Caminhos de registro descobertos em main/deobfuscated.js:
//   e(b.X, handler)        -> ipcMain.handle   renderer -> main
//   dt.on(b.X, handler)    -> ipcMain.on       renderer -> main
//   <x>.send(b.X, ...)     -> webContents.send main -> renderer
//   st(ctx, b.X, payload)  -> helper de push   main -> renderer   (main:63540)
//   QZ(l, b.X, k) e ternarios  -> aliases      resolvidos via RE_REF
import fs from 'node:fs';

const pre = fs.readFileSync(process.argv[2], 'utf8');
const main = fs.readFileSync(process.argv[3], 'utf8');
const preLines = pre.split('\n');
const mainLines = main.split('\n');

// tabela de canais:   chave: "maestri:<ns>:<acao>",
const DECL = /^\s*(\w+):\s*"(maestri:[^"]+)"\s*,?\s*$/;

function scanTable(src) {
  const m = new Map();
  src.split('\n').forEach((line, i) => {
    const r = DECL.exec(line);
    if (r) m.set(r[1], { channel: r[2], line: i + 1 });
  });
  return m;
}
const pTab = scanTable(pre);
const bTab = scanTable(main);

const RE_HANDLE = /(?:^|[^\w.$])e\(\s*b\.(\w+)\s*,/;
const RE_ON = /(?:^|[^\w.$])dt\.on\(\s*b\.(\w+)\s*,/;
const RE_SEND = /\.send\(\s*b\.(\w+)\s*[,)]/;
const RE_EMIT = /(?:^|[^\w.$])st\(\s*[a-zA-Z_$][\w$]*\s*,\s*b\.(\w+)/;
const RE_REF = /(?:^|[^\w.$])b\.(\w+)/;

// primeiro padrão que casar define a classificacao do canal
const TIERS = [
  [RE_HANDLE, 'handle'],
  [RE_ON, 'on'],
  [RE_SEND, 'send'],
  [RE_EMIT, 'emit'],
  [RE_REF, 'alias'],
];

function findImpl() {
  const out = new Map();
  // ref e global: uma mesma linha pode citar varios canais (ex. ternario
  //   `t === "partitura" ? b.partituraOpenRequested : b.workspaceOpenRequested`)
  const refG = new RegExp(RE_REF.source, 'g');
  mainLines.forEach((line, i) => {
    if (DECL.test(line)) return; // linha de declaracao nao e uso
    for (const [re, kind] of TIERS) {
      const g = new RegExp(re.source, 'g');
      let r;
      let matched = false;
      while ((r = g.exec(line))) {
        matched = true;
        if (!out.has(r[1])) {
          out.set(r[1], { kind, line: i + 1, snippet: line.trim().slice(0, 160) });
        }
      }
      if (matched && kind !== 'alias') break; // tier mais especifico vence
    }
  });
  return out;
}
const impl = findImpl();

const DIRECTION = {
  handle: 'renderer->main',
  on: 'renderer->main',
  send: 'main->renderer',
  emit: 'main->renderer',
  alias: null, // indeterminada sem ler o trecho
};

const rows = [];
for (const [key, { channel, line }] of pTab) {
  const h = impl.get(key);
  const decl = bTab.get(key);
  rows.push({
    key,
    channel,
    namespace: channel.split(':')[1],
    preload_line: line,
    main_decl_line: decl?.line ?? null,
    impl_kind: h?.kind ?? null,
    direction: h ? DIRECTION[h.kind] : null,
    impl_line: h?.line ?? null,
    snippet: h?.snippet ?? null,
    found: !!h,
  });
}
rows.sort((a, b) => a.channel.localeCompare(b.channel));

const found = rows.filter((r) => r.found);
const missing = rows.filter((r) => !r.found);
const up = found.filter((r) => r.direction === 'renderer->main');
const down = found.filter((r) => r.direction === 'main->renderer');
const alias = found.filter((r) => r.impl_kind === 'alias');

const byNs = {};
for (const r of rows) {
  const s = (byNs[r.namespace] ??= {
    total: 0, handle: 0, on: 0, send: 0, emit: 0, alias: 0, missing: 0,
  });
  s.total++;
  if (!r.found) s.missing++;
  else s[r.impl_kind]++;
}

fs.writeFileSync(process.argv[4], JSON.stringify({
  totals: {
    canais_no_preload: rows.length,
    implementacao_localizada: found.length,
    nao_localizada: missing.length,
    renderer_para_main: up.length,
    main_para_renderer: down.length,
    via_alias: alias.length,
  },
  by_namespace: byNs,
  channels: rows,
}, null, 2));

const md = [];
md.push('# Mapa de canais IPC - Maestri');
md.push('');
md.push('Gerado por `tools/ipc-map.mjs`. Nada foi executado: tudo vem de leitura estatica.');
md.push('');
md.push(`- Canais declarados no preload: **${rows.length}**`);
md.push(`- Implementacao localizada no main: **${found.length}** (${((found.length / rows.length) * 100).toFixed(1)}%)`);
md.push(`- renderer -> main: **${up.length}** \`(handle)\` / \`(on)\``);
md.push(`- main -> renderer: **${down.length}** \`(send)\` / \`(emit)\``);
md.push(`- via alias (direcao indeterminada): **${alias.length}**`);
md.push(`- nao localizada: **${missing.length}**`);
md.push('');
md.push('| Namespace | Canais | handle | on | send | emit | alias | s/ impl. |');
md.push('|---|---|---|---|---|---|---|---|');
for (const [ns, s] of Object.entries(byNs).sort((a, b) => b[1].total - a[1].total)) {
  md.push(`| ${ns} | ${s.total} | ${s.handle} | ${s.on} | ${s.send} | ${s.emit} | ${s.alias} | ${s.missing} |`);
}
md.push('');
md.push('## Detalhe por canal');
md.push('');
md.push('`decl` = linha da constante de canal em `main/deobfuscated.js`;');
md.push('`impl` = linha da implementacao encontrada.');
md.push('');
md.push('| canal | direcao | tipo | decl | impl |');
md.push('|---|---|---|---|---|');
for (const r of rows) {
  md.push(`| \`${r.channel}\` | ${r.direction ?? '—'} | ${r.impl_kind ?? '—'} | ${r.main_decl_line ?? '—'} | ${r.impl_line ?? '—'} |`);
}
md.push('');
if (missing.length) {
  md.push('## Sem implementacao localizada');
  md.push('');
  for (const m of missing) md.push(`- \`${m.channel}\``);
  md.push('');
}
fs.writeFileSync(process.argv[5], md.join('\n'));

console.log(`canais no preload      : ${rows.length}`);
console.log(`implementacao localizada: ${found.length} (${((found.length / rows.length) * 100).toFixed(1)}%)`);
console.log(`  renderer -> main      : ${up.length}`);
console.log(`  main -> renderer      : ${down.length}`);
console.log(`  via alias             : ${alias.length}`);
console.log(`nao localizada         : ${missing.length}`);
for (const m of missing) console.log(`  - ${m.channel}`);