// Extrai o catalogo de presets de agente (funcao ty / defaultAgentPresets) do main bundle.
import fs from 'node:fs';

const main = fs.readFileSync(process.argv[2], 'utf8');
const lines = main.split('\n');

const endIdx = lines.findIndex((l) => /a\(ty,\s*"defaultAgentPresets"\)/.test(l));
if (endIdx < 0) { console.error('ancora defaultAgentPresets nao encontrada'); process.exit(1); }

// caminha para tras ate o inicio da declaracao da funcao
let startIdx = endIdx;
for (let i = endIdx; i >= 0; i--) {
  if (/^(function|const|var|let)\s+ty\b/.test(lines[i])) { startIdx = i; break; }
}
const body = lines.slice(startIdx, endIdx + 1);

// cada preset comeca com  id: "..."  dentro de um objeto do array
const presets = [];
const re = /id:\s*"([^"]+)"\s*,\s*\r?\n\s*name:\s*"([^"]+)"\s*,\s*\r?\n\s*command:\s*"([^"]*)"/g;
let m;
while ((m = re.exec(body.join('\n'))) !== null) {
  presets.push({ id: m[1], name: m[2], command: m[3] });
}

// flags por preset, no trecho que segue cada id
const chunks = body.join('\n').split(/(?=id:\s*"[0-9A-F]{8}-)/i);
for (let i = 1; i < chunks.length; i++) {
  const c = chunks[i];
  const id = (c.match(/id:\s*"([^"]+)"/) || [])[1];
  const rec = presets.find((p) => p.id === id);
  if (!rec) continue;
  rec.icon = (c.match(/icon:\s*"([^"]+)"/) || [])[1] ?? null;
  rec.isActive = /isActive:\s*true/.test(c);
  rec.maestroMode = /maestroMode:\s*true/.test(c);
  rec.startInChatMode = /startInChatMode:\s*true/.test(c);
  rec.codexDaemonMigration = (c.match(/codexDaemonMigration:\s*"([^"]+)"/) || [])[1] ?? null;
  rec.identity = (c.match(/identity:\s*"([^"]+)"/) || [])[1] ?? null;
}

fs.writeFileSync(process.argv[3], JSON.stringify(presets, null, 2));

console.log(`funcao ty(): linhas ${startIdx + 1}-${endIdx + 1}`);
console.log(`presets extraidos: ${presets.length}\n`);
const w = Math.max(...presets.map((p) => p.name.length), 6);
console.log('nome'.padEnd(w) + '  comando'.padEnd(24) + ' icone'.padEnd(26) + ' flags');
for (const p of presets) {
  const flags = [p.isActive && 'ativo', p.maestroMode && 'maestroMode', p.startInChatMode && 'chatMode']
    .filter(Boolean).join(',') || '-';
  console.log(p.name.padEnd(w) + '  ' + (p.command || '(vazio)').padEnd(22) + ' ' + (p.icon ?? '-').padEnd(24) + ' ' + flags);
}