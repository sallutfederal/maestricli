# Reversing nativo — Swift CLI e relays WSL

Análise estática. **Nada foi executado.** Nenhum binário foi disassemblado em
pseudocódigo — ver "Limitações do método".

---

## 1. Disponibilidade de provedores neste host

Verificado antes de começar:

| Provedor | Estado | Motivo |
|---|---|---|
| Ghidra | `not_configured` | `GHIDRA_INSTALL_DIR` não definido. Java 21 **está** presente (`C:\Program Files\Java\jdk-21.0.12`), o Ghidra não. |
| Hopper | `unsupported_host` | integração só em macOS |
| IDA | `not_configured` | `REA_IDA_MCP_CONFIG` não definido |

Consequência: `procedure_pseudo_code`, `analyze_function` e `list_procedures`
do REA estão indisponíveis. A skill proíbe o REA de instalar o Ghidra, e não
o fiz.

**Por que isso atrapalha pouco, neste caso específico:** binários Swift carregam
a própria estrutura de tipos em seções de metadados, em texto legível, mesmo
sem stripped e sem tabela de símbolos. Isso é a rota padrão de reversing Swift e
não depende de decompilador.

---

## 2. `resources/cli/maestri.exe` — CLI Windows

| Propriedade | Valor |
|---|---|
| Formato | PE32+ x86-64, subsistema **3 (console)** |
| Tamanho | 8.142.336 bytes |
| Image base | `0x140000000` |
| Entry point | `0x14063aab4` |
| Timestamp de build | **2026-10-16T14:13:24Z** |
| Seções | 23 |
| **Seções Swift** | **17** (prefixo `.sw5*`) |
| **Bytes de metadado Swift** | **183.296** |
| **Símbolos Swift mangled** | **940** |

O timestamp (14:13:24Z) é **2 minutos depois** do `build-info.json`
(14:11:19Z) — o binário saiu da mesma execução de CI.

### Seções Swift e o que cada uma guarda

| Seção | Bytes | Conteúdo |
|---|---|---|
| `.sw5flmd` | 69.632 | field descriptors — **nomes dos campos de todas as structs** |
| `.sw5tyrf` | 39.424 | type references |
| `.sw5rfst` | 35.840 | reflection strings |
| `.sw5prtc` | 11.264 | conformidades de protocolo |
| `.sw5cptr` | 6.144 | capture descriptors |
| `.sw5asty` | 5.632 | metadata de assíncronos |
| `.sw5hash` | 4.608 | hashes de tipo |
| `.sw5tymd` | 4.608 | type metadata |
| `.sw5bltn` | 1.536 | builtins |
| `.sw5mpen` | 1.024 | metadata de enums |
| `.sw5prt`, `.sw5entr`, `.sw5acfn`, `.sw5ratt`, `.sw5repl`, `.sw5reps`, `.sw5test` | ≤512 cada | entradas auxiliares |

### Módulos Swift declarados (21)

Os do produto, extraídos dos nomes mangled:

**`MaestriCoreKit`** — 17 tipos. O núcleo compartilhado:
```
ActivityEnvironment        AskCancelToken          AskHandling
AskLifecycleDelegate       AskScheduler            CredentialStore
InterAgentTransportServer  LicenseActivationClient LicenseFallbackTransport
LicenseStore               MachineIdentity         MaestroNotificationHandling
ProcessTreeProvider        RelayByteStream         RouteQueryClient
TrialBackupStore           UsageMessageFramer
```

**`maestri`** — 3 tipos. A própria CLI:
```
CLIOutputSink   WSLRelayChild   WSLRelayLaunching
```

**`Crypto`** — 33 tipos (swift-crypto / BoringSSL):
```
AEADSealedBox · Cipher · Digest · DigestSigner · DigestValidator
HashFunction · BoringSSLBackedHashFunction
DiffieHellmanKeyAgreement
HPKEDiffieHellmanPrivateKey · HPKEDiffieHellmanPublicKey · HPKEPublicKeySerialization
KEMPrivateKey · KEMPublicKey
NISTECDSASignature · NISTECPrivateKey · NISTECPublicKey · NISTSigning
ASN1Serializable · ASN1Parseable · ASN1ObjectIdentifier
MessageAuthenticationCode · Signer · Zeroization · …
```

O resto é Foundation (130+50 símbolos), Dispatch, FoundationNetworking,
WinSDK e a stdlib.

---

## 3. `resources/wsl-runtime/maestri-linux-{x86_64,aarch64}` — relay WSL

| Propriedade | x86_64 | aarch64 |
|---|---|---|
| Formato | ELF 64-bit, **estático** | ELF 64-bit, **estático** |
| Tamanho | 72.031.200 B | ~69 MB |
| Seções | 40 | — |
| **Seções Swift** | **18** (`swift5_*`) | — |
| **Bytes de metadado Swift** | **636.957** | — |
| **Símbolos Swift mangled** | **599** | — |

Seções de código: `.text` 26,8 MB · `.rodata` 36,9 MB · `.eh_frame` 5,0 MB.

Toolchain, lida de `.comment`:
```
Apple clang version 17.0.0 (swiftlang/llvm-project 10999b6d034fe318f3d56c83bddb6572593a8bb0)
clang version 19.1.5 (swiftlang/llvm-project 10999b6d034fe318f3d56c83bddb6572593a8bb0)
```

**Módulos idênticos ao do CLI:** `MaestriCoreKit` (17 tipos) e `maestri` (3 tipos).
São o mesmo pacote Swift compilado para Windows e para Linux. O relay carrega a
runtime Swift estática inteira — daí os 72 MB.

---

## 4. Endpoints externos

| URL | Componente |
|---|---|
| `https://license.maestri.dev` | servidor de licença |
| `https://maestri-license.evert-ju.workers.dev` | backend de licença (Cloudflare Workers) |
| `https://push.maestri.dev/v1/send` | **envio de push** |
| `https://updates.maestri.dev/win/x64/` | updates (do app Electron, não do Swift) |

O endereço pessoal do autor (`evert-ju`) está **hardcoded no binário**, no
endpoint de licença. Isso é observável nos bytes, não interpretado.

---

## 5. Contrato de ambiente — variáveis `MAESTRI_*`

Extraídas dos literais do binário. É a interface entre o relay e o host:

| Variável | Papel aparente |
|---|---|
| `MAESTRI_HOST` | host do relay HTTP |
| `MAESTRI_TOKEN` | token de autenticação |
| `MAESTRI_SESSION` | id da sessão |
| `MAESTRI_TERMINAL_ID` | id do terminal |
| `MAESTRI_WORKSPACE_ID` | id do workspace |
| `MAESTRI_SOCKET` / `MAESTRI_PIPE` | canal de transporte |
| `MAESTRI_DATA_DIR` | diretório de dados |
| `MAESTRI_SECRET_STORE` | armazenamento de segredos |
| `MAESTRI_TUNNEL_HTTP` | túnel HTTP |
| `MAESTRI_REAL_HOME` | `$HOME` real (isolamento de sandbox) |
| `MAESTRI_ACCOUNT_API_KEY` | chave de conta injetada |
| `MAESTRI_ACCOUNT_SIGN_IN` | sign-in de conta |
| `MAESTRI_LICENSE_DEV` | flag de licença de desenvolvimento |
| `MAESTRI_CLI` | caminho da CLI |

### API HTTP do relay

```
POST http://$MAESTRI_HOST/cli
  X-Terminal-ID:   $MAESTRI_TERMINAL_ID
  X-Maestri-Token: $MAESTRI_TOKEN
  X-Workspace-ID:  $MAESTRI_WORKSPACE_ID
  Content-Type:    application/json
  body:            {"args": [...]}
```

Literal observado no binário:
```
curl -sS -o /dev/null -w '%{http_code}' \
  -H "X-Terminal-ID:$MAESTRI_TERMINAL_ID" \
  -H "X-Maestri-Token:$MAESTRI_TOKEN" \
  -H "X-Workspace-ID:$MAESTRI_WORKSPACE_ID" \
  -H "Content-Type:application/json" \
  -d '{"args":["help"]}' "http://$MAESTRI_HOST/cli"
```

Também presentes: `X-Maestri-Failure-Kind`, `X-Maestri-To`, `X-Portal*`,
`X-Role-*`, `X-Routine*`, `X-Note*`.

---

## 6. Integração de contas — leitura de credenciais de outros agentes

O binário lê arquivos de credencial de agentes instalados na máquina. Isto é
**observação de literais**, não de comportamento em execução — não houve
execução para confirmar quais caminhos são usados em cada caso.

| Agente | Caminhos no binário |
|---|---|
| Cursor | `.cursor/auth.json`, `.config/cursor/auth.json` |
| Devin | `AppData/Roaming/devin/credentials.toml`, `devin/credentials.toml` |
| OpenCode | `opencode/opencode.db` (via `OPENCODE_DB`), `.sqlite` |
| Codex | `auth.json`, `history.jsonl`, `session_index.jsonl` |
| Claude | `.credentials.json`, `config.toml`, `keybindings.json`, `mcp-config.json`, `managed_config.toml` |
| Antigravity | `.gemini/antigravity-cli/cli.log`, `oauth_creds.json`, `google_accounts.json`, `statsig-cache.json` |
| Maestri | `.license-credentials.json`, `.known-providers.json`, `.trusted-providers.json` |

Há também um esquema declarativo embutido com chaves `login`, `signOut`
(`{"delete": [...]}`), `private`, `pin`, `expect`, `hub`/`at` — a definição é
dirigida por dados, não fixa em código.

---

## 7. Controle de dispositivos Android

14 tipos Swift dedicated a automação Android:

```
AndroidDeviceAccessibility   AndroidDeviceSurfaceStatus
AndroidDeviceAction          AndroidDeviceRecord
AndroidDeviceAgentText       AndroidDeviceRPC
AndroidDeviceAutomation      AndroidDeviceSkill
AndroidDeviceConnection      AndroidDeviceContract
AndroidDeviceDescriptor      AndroidDeviceFailureKind
AndroidDeviceDiscovery       AndroidDeviceFamily
AndroidDeviceKind
```

Consistente com o `node_modules/node-pty` + ConPTY e com o namespace IPC
`maestri:device:*` (7 canais) e `maestri:remote:*` (18 canais) vistos no main
process do Electron._literal de exemplo:
`maestri portal navigate "Pixel" "https://example.com"` opens a URL through Android

---

## 8. Integração Git

APIs de pull request para GitHub, Gitea e GitLab, com token Bearer:

```
https://git.example.com/api/v1/repos/{path}/pulls
https://git.example.com/api/v1/repos/{path}/pulls?state=all&head={branch:url}&limit=1
https://{host}/{path}/-/merge_requests/new?merge_request[source_branch]=...
https://{host}/{path}/compare/{base}...{branch}?expand=1&...
```

`{branch:url}` e `{title:url}` são placeholders — o host/repo são
parametrizados em runtime. Isso casa com o namespace `maestri:gitHosts:*`
(5 canais) e `maestri:pullRequests:*` (36 canais) no Electron.

---

## 9. Limitações do método

O que **não** foi feito, e por quê:

- **Sem pseudocódigo.** Ghidra não está instalado neste host e a skill proíbe o
  REA de instalá-lo. Não há decompilação, nem assembly, nem grafo de chamadas.
  Para isso seria preciso instalar o Ghidra e apontar `GHIDRA_INSTALL_DIR`.
- **Não é comportamento.** Toda conclusão aqui vem de literais e metadados.
  Não houve execução. Que um arquivo de credencial seja *lido* em runtime não
  está estabelecido — só que o caminho está no binário.
- **Assinaturas incompletas.** O demanglerlite recovers módulo/tipo/membro, mas
  não tipos de parâmetro nem de retorno — isso exige a árvore de tipos de
  `swift5_type_metadata`, que não decodifiquei.
- **Escopo.** Só `cli/maestri.exe` e o relay x86_64. O aarch64 foi identificado
  pelo manifest mas não analisado; a arquitetura é a mesma.
- `app.asar.unpacked/node_modules/node-pty` (C++/ConPTY) não foi disassemblyado.

## 10. Artefatos gerados

| Arquivo | Conteúdo |
|---|---|
| `02-analysis/cli-native.json` | seções, 940 símbolos Swift, 41.383 strings do CLI |
| `02-analysis/cli-swift-api.json` | módulos e tipos demangled do CLI |
| `02-analysis/relay-x64-native.json` | seções, 599 símbolos, 191.833 strings do relay |
| `02-analysis/relay-swift-api.json` | módulos e tipos demangled do relay |
| `tools/native-pe.mjs` | parser PE/ELF + detecção Swift + extração de strings |
| `tools/swift-demangle.mjs` | demangler Swift lite |

## 11. Situação

| Passo | Status |
|---|---|
| Inventário de seções e provedor de Swift | **Concluído** |
| Módulos e tipos do produto | **Concluído** |
| Endpoints e contrato de ambiente | **Concluído** |
| Superfície do protocolo | **Concluído** |
| Decompilação / assembly | **Bloqueado** — requer Ghidra instalado |
| Análise de assinatura completa | **Em aberto** — requer decoder de `swift5_type_metadata` |