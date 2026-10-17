# Maestri — Análise de reverse engineering

**Alvo:** `C:\Users\usuario\Downloads\Maestri-Setup-latest.exe`
**SHA-256:** `9d607cf145676b6aa3818600865a1c2d43b7285766e49627ff565ab07c4d5f48`
**Tamanho:** 202.138.784 bytes (192,8 MB)
**Data da análise:** 2026-10-16
**Método:** extração estática em cascata (NSIS → 7z → ASAR). Nada foi executado.

---

## 1. Identidade

| Campo | Valor | Fonte |
|---|---|---|
| ProductName | Maestri | VS_VERSION_INFO no `.rsrc` |
| FileVersion | 0.25.0 | VS_VERSION_INFO |
| CompanyName | Evercraft Labs | VS_VERSION_INFO |
| FileDescription | A spatial canvas terminal workspace for AI agents. | VS_VERSION_INFO |
| Copyright | Copyright © 2026 Maestri | VS_VERSION_INFO |
| Homepage | https://themaestri.app | `package.json` |
| Autor (pkg) | Evercraft Labs `evert.ju@gmail.com` | `package.json` |

## 2. Cadeia de empacotamento (3 camadas)

```
Maestri-Setup-latest.exe            PE32 x86, 5 seções
│  .text .rdata .data .ndata(raw=0) .rsrc     ← stub NSIS-3 Unicode
│  overlay: 202.043.552 bytes (192,7 MB)
│
└─ NSIS-3 Unicode  (7-Zip: Type=Nsis, Method=Deflate)
   ├─ $PLUGINSDIR\app-64.7z       201.463.509 B  ← payload real
   ├─ $PLUGINSDIR\nsis7z.dll       434.176 B
   ├─ $PLUGINSDIR\{System,UAC,StdUtils,nsDialogs,nsExec,WinShell}.dll
   ├─ $PLUGINSDIR\modern-wizard.bmp
   └─ $R0\Uninstall Maestri.exe    222.144 B
│
└─ app-64.7z  (LZMA2:20 / BCJ2, 152 blocos, 152 arquivos → 743 MB)
   ├─ Maestri.exe          245.773.824 B   ← runtime Electron + ASAR embutido
   ├─ resources\app.asar   140.800.943 B
   ├─ resources\app.asar.unpacked\node_modules\node-pty\...
   ├─ resources\cli\maestri.exe (8,1 MB) + Swift runtime DLLs
   ├─ resources\wsl-runtime\maestri-linux-{x86_64,aarch64}  (ELF estáticos)
   ├─ resources\elevate.exe
   └── locales\ (55), *.pak, vulkan/ffmpeg/d3d
```

> O `inspect_artifact` do REA reportou o `.exe` externo como PE sem filhos
> (`node_count: 1`, `edge_count: 0`) porque o payload está em overlay Deflate
> de um NSIS — não num container ZIP/PE embarcado. Daí a extração em cascata.

## 3. Metadados de build

`resources/build-info.json`:
```json
{ "sha": "4adca62f56dcfcccd98fea4aff6e1e01044134fa", "builtAt": "2026-10-16T14:11:19.955Z", "build": 96 }
```

`resources/app-update.yml`:
```yaml
provider: generic
url: https://updates.maestri.dev/win/x64/
useMultipleRangeRequest: false
updaterCacheDirName: maestri-updater
```

## 4. Conteúdo do app.asar

Extraído para `01-extracted/asar-src/` pelo extrator `tools/asar-extract.mjs`.

| Métrica | Valor |
|---|---|
| Arquivos empacotados | 11.601 |
| Bytes empacotados | 131,4 MB |
| Entradas `unpacked:` (em `app.asar.unpacked`) | 38 |
| Pacotes em `node_modules/` | 133 |

### 4.1 Código do app (já bundlado, Vite/Rollup)

| Caminho | Tamanho | Papel |
|---|---|---|
| `out/main/index.js` | 1,69 MB | processo principal Electron |
| `out/main/chunks/` | 2 arquivos | chunks do main |
| `out/preload/index.js` | 83,7 KB | bridge de segurança (contextBridge) |
| `out/preload/update.js` | 675 B | auto-update |
| `out/renderer/index.html` | 1,6 KB | shell do renderer |
| `out/renderer/assets/index-BjUbVmEI.js` | 7,19 MB | bundle principal do renderer |
| `out/renderer/assets/` (188 arq.) | 21,7 MB | vendor lazy-loaded (mermaid, elk, katex, cytoscape, fontes) |

### 4.2 Dependências declaradas

- **UI:** React 19.1, react-dom 19.1, jotai 2.10, radix-ui 1.6.1, lucide-react, motion 12, sonner, class-variance-authority, tailwind-merge
- **Terminal:** `@xterm/xterm` + 6 addons (canvas, fit, search, serialize, unicode11, webgl) + `@xterm/headless` — todos `file:Packages/xterm.js/*` (fork local)
- **Editor/canvas:** @codemirror/{commands,lang-markdown,language,language-data,search,state,view}, @lezer/markdown
- **Diagramas:** mermaid 12, cytoscape (via mermaid), elk (3,6 MB, layout)
- **Backend local:** `node-pty` 1.2.0-beta.15 (ConPTY nativo + prebuilds p/ win32-x64/arm64, linux, darwin)
- **i18n:** i18next 25, react-i18next 16, i18next-browser-languagedetector
- **Runtime:** electron-updater 6.3.9, chokidar 4 (watch), fflate 0.8.3
- **Stack:** ESM (`"type": "module"`), entry `out/main/index.js`

### 4.3 Protocolos customizados (registrados via `registerSchemesAsPrivileged`)

Encontrados em `out/main/index.js` — são handlers do main process:

`maestri-file`, `maestri-tree`, `maestri-write`, `maestri-shell`, `maestri-workspace`,
`maestri-import-`, `maestri-export-`, `maestri-backup`, `maestri-restore-`,
`maestri-diagnostics-`, `maestri-git-`, `maestri-git-probe-`, `maestri-probe`,
`maestri-cow-probe-`, `maestri-portal`, `maestri-portal-`, `maestri-portal-devices`,
`maestri-routines`, `maestri-license`, `maestri-chat`, `maestri-create-floor`,
`maestri-role-discovery`, `maestri-drops`, `maestri-light`, `maestri-dark`,
`maestri-local`, `maestri-dev`, `maestri-dev-local`, `maestri-manager`

### 4.4 URLs externas encontradas

| URL | Contexto provável |
|---|---|
| `https://updates.maestri.dev/win/x64/` | feed do electron-updater |
| `https://pub-84eb0b1f3fb3420bbe57a88de7443b71.r2.dev/win/` | CDN de update (Cloudflare R2) |
| `https://themaestri.app` | homepage |
| `http://localhost` / `maestri.invalid` / `example.com` | placeholders de dev/test |

### 4.5 CSP do renderer (de `out/renderer/index.html`)

```
default-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: maestri-file: maestri-tree:;
media-src 'self' blob: maestri-file: maestri-tree:;
frame-src 'self' maestri-tree:; object-src 'self' maestri-tree:;
script-src 'self'; font-src 'self' data:;
```

O comentário no HTML explica que `frame-src`/`object-src` listam `maestri-tree`
para o visualizador de PDF embutido do Chromium (que é uma extensão e precisa
ser embedada), e que ambos são registrados também por compatibilidade entre
versões do Chromium.

## 5. Runtime auxiliar (fora do ASAR)

- `resources/cli/maestri.exe` (8,1 MB) — CLI nativa **Swift** (`swiftCore.dll`,
  `swiftDispatch.dll`, `swiftRegexBuilder.dll`, `Foundation*.dll`…).
- `resources/wsl-runtime/maestri-linux-x86_64` e `-aarch64` — binários ELF
  estáticos (~68/72 MB) para o relay dentro de WSL.
  `manifest.json`: `version 4adca62f`, `artifactVersion 3ab24ec8`,
  `relayProtocolVersion 1`.
- `resources/app.asar.unpacked/node_modules/node-pty` — binários nativos
  (conpty.dll, OpenConsole.exe, pty.node) + headers C++ (`src/win/conpty.h`).
- `resources/elevate.exe` — helper de elevação de privilégio.

## 6. Reprodução

```powershell
7z x "Maestri-Setup-latest.exe" -o01-extracted\nsis -y
7z x "01-extracted\nsis\`$PLUGINSDIR\app-64.7z" -o01-extracted\app-64 -y
node tools\asar-extract.mjs "01-extracted\app-64\resources\app.asar" "01-extracted\asar-src"
```

## 7. Limitações

- Nada foi executado; toda conclusão vem de bytes no disco.
- O código em `out/` está **minificado/bundlado** (Vite + Rollup). Não há TypeScript
  original, source maps, nem histórico de build no artefato — os nomes de símbolos
  internos não podem ser recuperados além do que o bundle preserva.
- `app.asar.unpacked` (38 entradas) só existe como `.node`/DLL/headers; o JS
  empacotado é o objeto analisado.
- `inspect_managed_artifact` do REA **não** rodou: o `.exe` de 193 MB excede o
  `max_snapshot_bytes` de 128 MiB do provider. Isso é consistente com um
  instalador nativo, não com assembly .NET.
- `analyze_javascript_application` do REA foi interrompido no ASAR de 134 MB
  (grafo semântico completo exige tempo/memória). A extração direta por header
  alcançou 100% dos 11.601 arquivos empacotados, então a cobertura de *bytes* é
  completa mesmo sem o grafo semântico do REA.
- A semântica de ~30 protocolos customizados ainda não foi confirmada — só a
  existência dos registros no main process foi observada.

## 8. Estado da investigação

| Questão | Status |
|---|---|
| O que é o app? | Respondida — Electron/React 19, spatial canvas p/ agentes de IA |
| Quais camadas de empacotamento? | Respondida — NSIS → 7z → ASAR |
| Código extraído? | Sim — `01-extracted/asar-src/` (11.601 arquivos) |
| Dependências? | Respondida — `package.json` íntegro |
| Arquitetura (protocolos/IPC)? | Parcial — lista de protocolos registrada, semântica não |
| Fluxo de rede / API backend? | **Em aberto** |
| Reconstrução do código original (TS/JSX)? | **Em aberto** — requer desminificar/reformatar os bundles |