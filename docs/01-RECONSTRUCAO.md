# Maestri — Reconstrução e análise do código

Ferramenta: **webcrack 2.16.0** (deobfuscação + desminificação + desembrulhamento de bundle).
Nada foi executado. Todos os dados vêm de leitura estática de bytes.

---

## 1. Resultado da desminificação

| Alvo | Origem | Saída | Transformações | Tempo |
|---|---|---|---|---|
| `preload/index.js` | 83,7 KB | 81,5 KB | 484 | ~0,1 s |
| `main/index.js` | 1,69 MB | **2,51 MB** | 34.603 | ~5 s |
| `renderer/assets/index-BjUbVmEI.js` | 7,19 MB | **7,02 MB** | 91.428 + 6.924 | ~14 s |

**Total: 126.515 transformações.**

Resultados em `03-reconstructed/{preload,main,renderer}/`.

### O que o webcrack recuperou

- **Comentários JSDoc originais** — não estavam minificados; o bundler os preservou
  e o webcrack os reposicionou. Exemplo real do renderer:
  ```js
  /**
   * Schedule a process to run on the next frame.
   */
  schedule: /* @__PURE__ */ __name((callback, keepAlive = false, immediate = false) => { ... })
  ```
- **Renderer desembrulhado**: 84 módulos extraídos para arquivos `NNNN.js` numerados
  (chunks lazy do Vite: diagramas Mermaid, ELK, KaTeX, Cytoscape).
- **Nomes de função do app preservados**: 3.491 funções nomeadas de nível superior no
  renderer, com nomes significativos — `planDuplicateSelection`, `remapPastedNoteStacks`,
  `workspaceFilesDir`, `attachmentPreviewUrl`, `canvasContentPosition`, `floorStatusOf`.
  O vendor foi renomeado pelo bundler, então os nomes legíveis são a fronteira
  app/vendor.
- **Strings concatenadas e ofuscadas resolvidas**: `deobfuscate: 0 changes` e
  `String Array: no` indicam que não havia ofuscação de string array — só minificação.

---

## 2. Superfície da API — 445 canais IPC

O preload é o arquivo de maior retorno: define a ponte `contextBridge.exposeInMainWorld("maestri", api)`.
A tabela `C` é o contrato completo renderer↔main.

| Namespace | Canais | Namespace | Canais |
|---|---|---|---|
| pullRequests | 36 | floor | 26 |
| fileTree | 35 | terminal | 22 |
| workspace | 29 | app | 19 |
| chat | 28 | remote | 18 |
| accounts | 27 | noteStack | 16 |
| data | 16 | note | 14 |
| agent | 13 | floorHooks | 13 |
| connection | 12 | routine | 11 |
| partitura | 10 | portal | 8 |
| files | 7 | license | 7 |
| device | 7 | agentUsage | 7 |
| prompter | 7 | node | 7 |
| drawing | 6 | preferences | 5 |
| windowControls | 5 | gitHosts | 5 |
| updates | 4 | group | 4 |
| cableTie | 4 | portalDesign | 4 |
| appState | 3 | sidebarLayout | 3 |
| floorSnapshot, clipboard, tidyNode, palette, snapNode, codex, interAgent | 1 cada | | |

Formato: `maestri:<namespace>:<ação>` (ex. `maestri:pullRequests:*`, `maestri:accounts:addApiKey`).

---

## 3. Modelo de segurança do renderer

`out/renderer/index.html` define a CSP — observada, não inferida:

```
default-src 'self';
style-src  'self' 'unsafe-inline';
img-src   'self' data: blob: maestri-file: maestri-tree:;
media-src 'self' blob: maestri-file: maestri-tree:;
frame-src 'self' maestri-tree:;
object-src 'self' maestri-tree:;
script-src 'self';
font-src  'self' data:;
```

Pontos notáveis:

- `script-src 'self'` sem `unsafe-inline` / `unsafe-eval` — CSP **rígida**.
- `nodeIntegration` desligado; a única ponte é o preload via `contextBridge`.
- Os comentários no HTML (preservados) explicam que `maestri-tree` aparece em
  `frame-src` **e** `object-src` porque o visualizador de PDF do Chromium é uma
  extensão, e qual das duas políticas é checada mudou entre versões do Chromium.
- `maestri-file` e `maestri-tree` são protocolo do main process com checagem de
  caminho própria; o comentário afirma que **não são alcançáveis por `fetch`** do renderer.

---

## 4. Arquitetura: app local-first, sem backend próprio

Achado mais significativo da análise de rede.

**URLs externas reais encontradas — apenas 2:**

| URL | Papel |
|---|---|
| `https://updates.maestri.dev/win/x64/` | feed do electron-updater |
| `https://pub-84eb0b1f3fb3420bbe57a88de7443b71.r2.dev/win/` | CDN de update (Cloudflare R2) |

Todas as outras são placeholders: `localhost:3000/4000/5173`, `example.com`,
`example.com/login`, `maestri.invalid`, `github.com/acme/app/pull/42`.

**Não existe backend da Maestri.** O app não tem servidor de API próprio — ele é um
*host* para agentes de IA que o usuário configura, com as próprias credenciais.

Canais de conta confirmam isso:
`maestri:accounts:add`, `:addApiKey`, `:replaceKey`, `:setEndpoint`, `:signOut`, `:rename`.

O descritor de capacidade de cada provedor de agente (`GY`) revela o modelo:

```
supportsAPIKey · apiKeyVariable · apiKeyGatewayVariable · keepsOwnHistory
signsOutInTerminal · launchesOnlySignedIn · givesCommandsTheRealHome
takesSignInHost · signsInOnMacHosts · sandboxSecretReplacesAccount
sandboxSecretServices · provenLoginPath · runsInDockerSandbox
hiddenVariables · handsBackToCommands
```

Ou seja: o Maestri orquestra CLIs de agentes já instalados na máquina
(Codex é referenciado: `maestri:codex:isMissingFlag`), injetando variáveis de
ambiente para chave/endpoint, e cada provedor declara como quer ser sandboxed.

Existe também um **servidor HTTP local com verificação Bearer** no main process
(`verifyBearer`, resposta 401 `"Unauthorized"`) — relay local, não backend em nuvem.

---

## 5. Ferramentas nativas (fora do alcance de desminificação)

| Artefato | Stack | Nota |
|---|---|---|
| `resources/cli/maestri.exe` (8,1 MB) | Swift + Foundation | CLI nativa do Windows |
| `wsl-runtime/maestri-linux-x86_64` (~72 MB) | ELF estático | relay dentro de WSL |
| `wsl-runtime/maestri-linux-aarch64` (~69 MB) | ELF estático | idem, ARM |
| `app.asar.unpacked/.../node-pty` | C++ (ConPTY) | headers em `src/win/conpty.h` |

O relay WSL tem manifest próprio: `version 4adca62f`, `artifactVersion 3ab24ec8`,
`relayProtocolVersion 1` — protocolo versionado e independente.

---

## 6. Como navegar o código reconstruído

Ordem sugerida de leitura:

1. `03-reconstructed/preload/deobfuscated.js` — objeto `C` (linhas ~20+) dá a API inteira de graça
2. `03-reconstructed/main/deobfuscated.js` — grep por `maestri:<ns>:` acha o handler de cada canal
3. `03-reconstructed/renderer/deobfuscated.js` — 189.071 linhas; app começa por volta da linha 30.000
   (antes disso é React/Radix/Motion). Os nomes de função marcam a fronteira.
4. `03-reconstructed/renderer/NNNN.js` — chunks lazy vendor (Mermaid, ELK, KaTeX)

---

## 7. Limitações

- **O TypeScript/JSX original não é recuperável.** Não há source map (verificado: 0
  arquivos `.map`, 0 referências a `sourceMappingURL`). O webcrack **não** decompila
  JSX de volta para React elements no renderer — só no main/preload, onde não há JSX.
- Nomes de variáveis locais continuam minificados (`s`, `t`, `n`, `e`). Só funções e
  constantes de topo ganharam nome legível.
- Strings e comments de dependências não são parte da licença analisável — os
  componentes vendor permanecem opacos quanto à origem.
- A semântica de implementação dos 445 canais foi **catalogada**, não lida. O
  passo seguinte seria mapear canal→handler no main.
- Nenhum binário nativo foi disassemblyado. Isso exige toolchain separada
  (strings/Ghidra) e é um trabalho distinto.

## 8. Situação

| Passo | Status |
|---|---|
| 0 — source maps | **Concluído** (não existem) |
| 1 — preload | **Concluído** |
| 2 — main | **Concluído** |
| 3 — renderer (seletivo) | **Concluído** |
| 4 — superfície de rede | **Concluído** |
| Canal → handler (main) | Em aberto |
| Binários nativos (Swift/ELF) | Em aberto |