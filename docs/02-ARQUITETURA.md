# Maestri — Índice de navegação

Gerado a partir de `Maestri-Setup-latest.exe` (SHA-256 `9d607cf1…d5f48`).
Nada foi executado. Toda afirmação vem de leitura estática.

---

## Onde está cada coisa

```
maestri-re/
├─ 01-extracted/
│  ├─ nsis/                     camada 1 — stub NSIS-3 + $PLUGINSDIR
│  ├─ app-64/                   camada 2 — runtime Electron + binários nativos
│  └─ asar-src/                camada 3 — CÓDIGO BRUTO do app
│     ├─ package.json           manifesto íntegro
│     ├─ node_modules/          133 pacotes
│     └─ out/
│        ├─ main/index.js       1,69 MB  processo principal
│        ├─ preload/index.js     83,7 KB ponte de segurança
│        └─ renderer/           shell + bundle de 7,19 MB
│
├─ 03-reconstructed/            webcrack 2.16.0 — LEGÍVEL
│  ├─ preload/deobfuscated.js    81,5 KB   1.962 linhas
│  ├─ main/deobfuscated.js       2,51 MB  102.659 linhas
│  └─ renderer/
│     ├─ deobfuscated.js         7,02 MB  189.057 linhas
│     └─ 5435.js … 6351.js       84 chunks lazy vendor
│
├─ 02-analysis/
│  ├─ ipc-map.json / .md        445 canais IPC mapeados
│  └─ agent-presets.json        catálogo de agentes embutido
│
├─ tools/
│  ├─ asar-extract.mjs          extrator de ASAR (7-Zip não lê ASAR cru)
│  ├─ ipc-map.mjs               mapeador canal→implementação
│  └─ agent-catalog.mjs         extrator de presets
│
└─ docs/
   ├─ 00-INVENTARIO.md          empacotamento, identidade, metadados
   ├─ 01-RECONSTRUCAO.md        resultados do webcrack
   └─ 02-ARQUITETURA.md         (você está aqui)
```

---

## Ordem de leitura recomendada

### 1. A API inteira, de graça — `preload/deobfuscated.js`

O objeto `C` perto do início é a tabela de **445 canais**. Lendo só isso você
entende o contrato completo renderer↔main sem abrir mais nada.

```
C = {
  appInfo: "maestri:app:info",
  appDiagnosticReport: "maestri:app:diagnosticReport",
  ...
}
```

Depois, `contextBridge.exposeInMainWorld("maestri", api)` — uma única ponte.

### 2. O comportamento — `main/deobfuscated.js`

Use o mapa de IPC para pular direto ao que importa:

```powershell
# achar a linha de um canal no mapa
Select-String -Path 02-analysis\ipc-map.md -Pattern 'pullRequests:create'
```

O mapa dá, por canal: direção, tipo, linha da constante e linha da implementação.

### 3. A UI — `renderer/deobfuscated.js`

189.057 linhas. **O app começa por volta da linha 30.000** — antes disso é
React/Radix/Motion. A fronteira é nítida: o vendor teve nomes de função
renomeados pelo bundler, o app não.

Nomes preservados são o mapa de navegação:
`planDuplicateSelection` · `remapPastedNoteStacks` · `workspaceFilesDir` ·
`attachmentPreviewUrl` · `canvasContentPosition` · `floorStatusOf` ·
`cableTiesCoveredBy` · `floorHoldingTerminal`

---

## Mapa de IPC — 444 de 445 canais (99,8%)

| | Canais |
|---|---|
| renderer → main (`handle`/`on`) | 395 |
| main → renderer (`send`/`emit`) | 46 |
| via alias (direção indeterminada) | 3 |
| **não localizado** | **1** |

### O canal morto

`maestri:app:shutdown` é declarado na tabela do preload **e** na do main,
assinado pelo renderer (`subscribe(C.appShutdown, …)`) — mas o main **nunca
o emite**. Só `maestri:app:shutdownPainted` existe de fato (`main:60540` e
`main:63073`). É resíduo de uma versão anterior, não uma lacuna de análise.

### Maiores namespaces

| Namespace | Canais | O que controla |
|---|---|---|
| pullRequests | 36 | integração Git — PRs |
| fileTree | 35 | árvore de arquivos, watcher, busca |
| workspace | 29 | workspaces, níveis |
| chat | 28 | conversas com agentes |
| accounts | 27 | contas/chaves de agentes |
| floor | 26 | o "floor" (canvas espacial) |
| terminal | 22 | terminais PTY |
| remote | 18 | acesso remoto / portal |
| noteStack · note | 30 | notas e anotações |
| agent · agentUsage | 20 | agentes e telemetria |
| license | 7 | licenciamento |

---

## Catálogo de agentes embutido

`main/deobfuscated.js` linhas **11.513–11.597** (função `ty`, alias
`defaultAgentPresets`). Sobreponível por config do usuário (`agentPresets`,
decodificado por `PB`).

| Nome | Comando | Ícone |
|---|---|---|
| Claude Code | `claude` | seal |
| Codex | `codex --no-daemon` | brain |
| Antigravity | `agy` | sparkle |
| OpenCode | `opencode` | rectangle.portrait |
| Shell | *(vazio)* | terminal |

Todos com `isActive: true`. `maestroMode` e `startInChatMode` vêm `false`
em todos — são configurações por usuário, não padrão.

---

## Modelo de arquitetura

**Não há backend da Maestri.** As únicas URLs externas em todo o main process:

- `https://updates.maestri.dev/win/x64/` — feed do electron-updater
- `https://pub-84eb0b1f3fb3420bbe57a88de7443b71.r2.dev/win/` — CDN (R2)

Todo o resto é placeholder (`localhost:3000/4000/5173`, `example.com`,
`maestri.invalid`, `github.com/acme/app/pull/42`).

O app é um **host** que orquestra CLIs de agentes instaladas na máquina local.
Você fornece as credenciais (`accounts:addApiKey`, `accounts:setEndpoint`) e
o app injeta variáveis de ambiente conforme as capacidades declaradas por
cada agente:

```
supportsAPIKey · apiKeyVariable · apiKeyGatewayVariable · keepsOwnHistory
signsOutInTerminal · launchesOnlySignedIn · givesCommandsTheRealHome
takesSignInHost · signsInOnMacHosts · sandboxSecretReplacesAccount
sandboxSecretServices · provenLoginPath · runsInDockerSandbox
hiddenVariables · handsBackToCommands
```

Existe um **servidor HTTP local com verificação Bearer** (`verifyBearer`,
401 `"Unauthorized"`) — relay local, não nuvem.

---

## Segurança observada

CSP em `renderer/index.html`:

```
default-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: maestri-file: maestri-tree:;
media-src 'self' blob: maestri-file: maestri-tree:;
frame-src 'self' maestri-tree:; object-src 'self' maestri-tree:;
script-src 'self'; font-src 'self' data:;
```

- `script-src 'self'` — sem `unsafe-inline`, sem `unsafe-eval`
- `nodeIntegration` desligado; ponte única via `contextBridge`
- `maestri-file` / `maestri-tree` têm checagem de caminho no main process;
  o comentário no HTML afirma que não são alcançáveis por `fetch`

---

## Binários nativos (não desminificáveis)

| Artefato | Stack |
|---|---|
| `app-64/resources/cli/maestri.exe` (8,1 MB) | Swift + Foundation |
| `app-64/resources/wsl-runtime/maestri-linux-x86_64` (~72 MB) | ELF estático |
| `app-64/resources/wsl-runtime/maestri-linux-aarch64` (~69 MB) | ELF estático |
| `app-64/resources/app.asar.unpacked/…/node-pty` | C++ / ConPTY |

Relay WSL tem protocolo versionado à parte: `manifest.json` →
`version 4adca62f`, `artifactVersion 3ab24ec8`, `relayProtocolVersion 1`.

---

## Limitações

- **TypeScript/JSX original não é recuperável** — zero `.map`, zero
  `sourceMappingURL`. O que existe é bundle legível com nomes de função
  preservados e JSDoc restaurado (1.145 comentários), não código-fonte.
- Variáveis locais seguem minificadas (`s`, `t`, `n`, `e`). Só funções e
  constantes de topo ganharam nome.
- O webcrack não decompila JSX de volta no renderer — o bundle de 7 MB é
  JavaScript puro.
- A **semântica** dos 444 canais foi catalogada, não lida: o mapa diz onde
  cada um é implementado, não o que ele faz.
- Nenhum binário nativo foi disassemblyado.
- A contagem "implementação localizada" é por referência textual — um canal
  pode estar referenciado no main e ainda assim o tratamento ser trivial.