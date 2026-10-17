# Reverse engineering do Maestri

Análise estática completa de `Maestri-Setup-latest.exe` (v0.25.0, Evercraft Labs) —
do empacotamento até a recuperação de assinaturas Swift, com ferramentas próprias.

**Nada foi executado a partir dos artefatos analisados.** Todos os números aqui
vim de leitura de bytes em disco.

---

## O que é o alvo

| | |
|---|---|
| Arquivo | `Maestri-Setup-latest.exe` |
| SHA-256 | `9d607cf145676b6aa3818600865a1c2d43b7285766e49627ff565ab07c4d5f48` |
| Tamanho | 202.138.784 bytes |
| Produto | Maestri 0.25.0 — *Evercraft Labs* |
| Descrição | "A spatial canvas terminal workspace for AI agents." |
| Homepage | https://themaestri.app |
| Commit de build | `4adca62f56dcfcccd98fea4aff6e1e01044134fa` (build #96, 2026-10-16) |

App desktop **Electron 39 + React 19**, empacotado com electron-builder, que
orquestra CLIs de agentes de IA (Claude Code, Codex, Antigravity, OpenCode)
instaladas na máquina do usuário.

---

## Documentação

| Doc | Conteúdo |
|---|---|
| [`docs/00-INVENTARIO.md`](docs/00-INVENTARIO.md) | Identidade, cadeia de empacotamento, metadados de build |
| [`docs/01-RECONSTRUCAO.md`](docs/01-RECONSTRUCAO.md) | Resultados do webcrack (126.515 transformações) |
| [`docs/02-ARQUITETURA.md`](docs/02-ARQUITETURA.md) | Índice de navegação, mapa de IPC, arquitetura, catálogo de agentes |
| [`docs/03-NATIVO.md`](docs/03-NATIVO.md) | Reversing do CLI Swift e dos relays ELF do WSL |
| [`docs/04-SWIFT.md`](docs/04-SWIFT.md) | Decoder de metadados Swift — o que funciona e o que não |
| [`docs/05-ASAR.md`](docs/05-ASAR.md) | Empacotador ASAR e teste de ida e volta |

---

## Resultados em números

| Métrica | Valor |
|---|---|
| Arquivos extraídos do ASAR | 11.601 empacotados + 38 `unpacked` |
| Transformações webcrack | 126.515 |
| Linhas de código recuperadas | 291.678 legíveis |
| Canais IPC mapeados | **444 de 445 (99,8%)** |
| Símbolos Swift decodificados | 940 (CLI) + 599 (relay) |
| Tipos Swift reconstruídos | 3.206 (relay) + 1.194 (CLI) |
| Campos Swift com nome resolvido | 9.987 (**100%** no relay) |
| Round-trip do ASAR | **11.601/11.601 SHA-256 idênticos** |

---

## Cadência de empacotamento

```
Maestri-Setup-latest.exe            PE32 x86, 5 seções, stub NSIS-3
└─ overlay Deflate: 192,7 MB
   └─ $PLUGINSDIR\app-64.7z        LZMA2:20 / BCJ2 → 743 MB
      └─ resources\app.asar         134 MB
         └─ 11.639 entradas, 133 pacotes
      └─ resources\cli\maestri.exe  8,1 MB — Swift + Foundation
      └─ resources\wsl-runtime\maestri-linux-{x86_64,aarch64}
```

---

## Ferramentas

Todas em [`tools/`](tools/), sem dependência de framework — Node puro.

| Script | O que faz |
|---|---|
| `asar-extract.mjs` | Extrai um `.asar` lendo o header JSON. 7-Zip não lê ASAR cru. |
| `asar-pack.mjs` | Reempacota uma árvore em `.asar`. `--order-from` preserva ordem e flags `unpacked`. |
| `asar-verify.mjs` | Compara dois `.asar` por SHA-256, entrada a entrada. |
| `native-pe.mjs` | Parser PE/ELF, detecta seções Swift, extrai símbolos e strings. |
| `swift-demangle.mjs` | Demangler gramatical de nomes mangled Swift (11/11 testes). |
| `swift-reflect.mjs` | Lê `swift5_fieldmd` / `.sw5flmd` — structs, campos, tipos. |
| `ipc-map.mjs` | Mapeia os 445 canais IPC do preload para o main. |
| `agent-catalog.mjs` | Extrai o catálogo de agentes embutido. |

### Uso

```powershell
# ASAR — ciclo completo
node tools\asar-extract.mjs "<app>\resources\app.asar" "01-extracted\asar-src"
Copy-Item "<app>\resources\app.asar.unpacked\*" "01-extracted\asar-src" -Recurse -Force
node tools\asar-pack.mjs "01-extracted\asar-src" "<novo>.asar" --order-from "<backup>.asar"
node tools\asar-verify.mjs "<backup>.asar" "<novo>.asar"

# IPC
node tools\ipc-map.mjs `
  "03-reconstructed\preload\deobfuscated.js" `
  "03-reconstructed\main\deobfuscated.js" `
  "02-analysis\ipc-map.json" "02-analysis\ipc-map.md"

# Nativo
node tools\native-pe.mjs "<binario>" "saida.json"
node tools\swift-reflect.mjs "<binario>" "<filtro>" "saida.json"
```

Dependência externa única: `webcrack@2.16.0` (instalar com
`npm install webcrack`, dentro de `tools/`).

---

## Arquitetura em uma tela

**Não há backend da Maestri.** As únicas URLs externas em todo o processo
principal são de update:

```
https://updates.maestri.dev/win/x64/
https://pub-84eb0b1f3fb3420bbe57a88de7443b71.r2.dev/win/
```

O app é um **host** que orquestra CLIs de agentes já instaladas na máquina. O
usuário fornece as credenciais (`maestri:accounts:addApiKey`) e o app injeta
variáveis de ambiente conforme as capacidades declaradas por cada agente.

### Interface renderer↔main

Ponte única: `contextBridge.exposeInMainWorld("maestri", api)`.

**445 canais IPC em 40 namespaces.** Maiores: `pullRequests` (36),
`fileTree` (35), `workspace` (29), `chat` (28), `accounts` (27), `floor` (26),
`terminal` (22), `remote` (18).

### Catálogo de agentes embutido

Extraído de `main/index.js` linhas 11.513–11.597:

| Nome | Comando | Ícone |
|---|---|---|
| Claude Code | `claude` | seal |
| Codex | `codex --no-daemon` | brain |
| Antigravity | `agy` | sparkle |
| OpenCode | `opencode` | rectangle.portrait |
| Shell | *(vazio)* | terminal |

### CSP do renderer

```
default-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: maestri-file: maestri-tree:;
frame-src 'self' maestri-tree:; object-src 'self' maestri-tree:;
script-src 'self'; font-src 'self' data:;
```

`script-src 'self'` sem `unsafe-inline` nem `unsafe-eval`;
`nodeIntegration` desligado.

---

## Camada nativa

| Artefato | Stack | Símbolos Swift |
|---|---|---|
| `resources/cli/maestri.exe` (8,1 MB) | Swift + Foundation, PE x86-64 console | 940 |
| `resources/wsl-runtime/maestri-linux-x86_64` (72 MB) | ELF estático | 599 |
| `resources/wsl-runtime/maestri-linux-aarch64` (69 MB) | ELF estático | — |

Módulos do produto, idênticos nos dois: **`MaestriCoreKit`** (17 tipos) e
**`maestri`** (3 tipos).

```
MaestriCoreKit:  ActivityEnvironment  AskCancelToken  AskHandling
                 AskLifecycleDelegate  AskScheduler   CredentialStore
                 InterAgentTransportServer  LicenseActivationClient
                 LicenseFallbackTransport  LicenseStore  MachineIdentity
                 MaestroNotificationHandling  ProcessTreeProvider
                 RelayByteStream  RouteQueryClient  TrialBackupStore
                 UsageMessageFramer

maestri:        CLIOutputSink   WSLRelayChild   WSLRelayLaunching
```

Endpoints descobertos no CLI: `https://license.maestri.dev`,
`https://maestri-license.evert-ju.workers.dev`, `https://push.maestri.dev/v1/send`.

---

## O que este repositório **não** contém

Os artefatos extraídos do app foram deliberadamente **não versionados**:

- `01-extracted/` — ~1 GB de binários, bundles e `node_modules` do Maestri
- `03-reconstructed/` — código do app desobfuscado pelo webcrack
- `02-analysis/*-native.json`, `*-fields.json` — dumps literais de string
  extraídos dos binários
- `02-analysis/roundtrip/` — o `app.asar` remontado

São material proprietário de terceiros (Evercraft Labs) e pesariam mais de 1 GB
no git. **As ferramentas e os relatórios que os produzem estão aqui**; o fluxo
completo para regerar os artefatos está documentado no README e nos docs.

Os relatórios neste repositório citam trechos curtos de código, nomes de
símbolos e literais do app como evidência de análise — o que é uso analítico
justo, não redistribuição.

---

## Limitações

- **Sem decompilação.** Ghidra não está instalado neste host; `procedure_pseudo_code`
  indisponível. Hopper é macOS-only, IDA não configurado.
- **Sem source maps.** Zero arquivos `.map` no artefato — o TypeScript original
  não é recuperável. O que existe é bundle legível com nomes de função
  preservados e JSDoc restaurado.
- **Tipos dos campos Swift não resolvidos.** `MangledTypeName` atravessa uma
  referência indireta em `swift5_typeref` cujo encoding não foi implementado.
  Os **nomes** dos campos resolvem em 100%. Ver [`docs/04-SWIFT.md`](docs/04-SWIFT.md).
- **Nada foi executado.** Que um arquivo de credencial seja lido em runtime não
  está estabelecido — só que o caminho está gravado no binário.
- **Semântica dos 444 canais não lida.** O mapa diz onde cada um é implementado,
  não o que faz.

---

## Uso responsável

Este material é para estudo de engenharia reversa e modificação local do app que
você já possui. Os dumps de credenciais de agentes citados em
[`docs/03-NATIVO.md`](docs/03-NATIVO.md) são observações de literais em binário —
não foram usados para acessar nada.