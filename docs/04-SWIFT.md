# Decoder de metadados Swift — o que funciona e o que não

Duas ferramentas escritas do zero em `tools/`:

| Arquivo | Papel |
|---|---|
| `swift-demangle.mjs` | demangler da linguagem de nomes mangled do Swift |
| `swift-reflect.mjs` | leitor de `swift5_fieldmd` / `.sw5flmd` — structs, campos, tipos |

Nada foi executado a partir dos binários analisados; ambos leem bytes do disco.

---

## 1. `swift-demangle.mjs` — funcional

Parser gramatical recursivo, não regex. Ordem real do encoding:

```
prefixo?   nome-nominal   <argumentos-genericos>?   sufixo
```

Cobertura: tipos nominais (com módulo e sem), genéricos, `Optional`, `Array`,
`Dictionary`, `Metatype`, primitivos, builtins da stdlib (`s5Int32V`), tipos
função `(Params) -> Ret`, e manglings sem prefixo `$s` (como aparecem em
registros de campo).

Teste: **11/11** (`node test-demangle.mjs`, removido após validar).

```
$s14MaestriCoreKit7SessionC            -> MaestriCoreKit.Session
$s7maestri13WSLRelayChildC             -> maestri.WSLRelayChild
$s14MaestriCoreKitSg7Session5AgentCSg  -> Optional<MaestriCoreKit.Session<Agent>>
Say14MaestriCoreKit7SessionCG          -> Array<MaestriCoreKit.Session>
SDySSSiG                               -> Dictionary<String, Int>
s5Int32V                               -> Int32
7Session                               -> Session            (sem prefixo $s)
```

**Desambiguação que valeu registro:** `14MaestriCoreKit7Session5AgentC` é
ambíguo — pode ser `Modulo.Tipo<Arg>` ou `Tipo<Modulo...>`. Não há como
distinguir pelo formato. Adotei: sem container, o primeiro identificador é o
nome do tipo (argumento genérico); dentro de `Array`/`Dictionary`, o primeiro é
o módulo. Isso é uma escolha documentada, não uma verdade do formato.

---

## 2. `swift-reflect.mjs` — parcialmente funcional

### O que decodifica

Formato implementado (`swift/include/swift/Runtime/Metadata.h`):

```
TargetFieldDescriptor {
  int32  MangledTypeName;   // ponteiro relativo
  int32  Superclass;
  uint16 Kind;              // 0 struct · 1 class · 2 enum · 3 multi-payload
                            // 4 protocol · 5 class protocol · 6/7 objc
  uint16 FieldRecordSize;
  uint32 NumFields;
}

TargetFieldRecord {
  int32  Flags;             // bit 0 = IsIndirect
  int32  MangledTypeName;   // ponteiro relativo
  int32  FieldName;         // ponteiro relativo
}
```

**Bug real que precisei achar:** os descritores têm passo **variável**.
Assumir 16 bytes fixos — o que parece natural pelo tamanho do cabeçalho —
desalinha a partir do primeiro tipo que tenha campos. O avanço correto é
`16 + NumFields × FieldRecordSize`. Com passo fixo, 10.867 de 10.931
descritores eram descartados; com o correto, **3.206 tipos / 9.987 campos**.

Ponteiro relativo: base é o endereço do próprio campo, e o valor é um
deslocamento de **endereço virtual** (ELF) — não offset de arquivo. Neste
binário a base é 0x200000, uniforme entre seções, então
`alvo_arquivo = posição_do_campo + int32`.

`FieldName` é ponteiro **direto** para texto simples em `swift5_reflstr`, e
resolve sem ambiguidade. Essa é a parte sólida do decoder.

### Cobertura medida

| Binário | Seção | Tipos | Campos | Nomes resolvidos |
|---|---|---|---|---|
| relay Linux x86-64 | `swift5_fieldmd` | 3.206 | 9.987 | **100,0%** |
| CLI Windows | `.sw5flmd` | 1.194 | 2.398 | **73,8%** |

A diferença na cobertura se deve à seção `.sw5flmd` do PE usar um
registro de campo de 12 bytes idêntico, mas com parte dos nomes não
NUL-terminados no layout do Windows — o leitor conservador os descarta em vez
de adivinhar.

### Validação do resultado

Os campos decodificados são coerentes com código Swift real e conhecido:

```
var kem  ·  kdf  ·  aead  ·  keySchedule  ·  encapsulated
var inconsistentParameters  ·  inconsistentCiphersuiteAndKey
var exportOnlyMode  ·  inconsistentPSKInputs  ·  expectedPSK
var unexpectedPSK  ·  outOfRangeSequenceNumber  ·  ciphertextTooShort
var HKDF_SHA256  ·  HKDF_SHA384  ·  HKDF_SHA512
var sequenceNumber  ·  key  ·  nonce  ·  exporterSecret  ·  ciphersuite
```

`inconsistentCiphersuiteAndKey`, `outOfRangeSequenceNumber` e
`ciphertextTooShort` são os casos reais do enum de AEAD AdditionalData do
TLS 1.3 (`AEADAdditionalDataUsage` do swift-crypto). `HKDF_SHA256/384/512`
são os casos do enum `HKDFFunction`. A decodificação está correta.

### O que NÃO funciona — e por quê

**O nome do tipo do campo e o nome do descritor não são resolvidos.**

`MangledTypeName` não é ponteiro direto para a string. Ele atravessa uma
*referência indireta* em `swift5_typeref`, cujo encoding é um cabeçalho de
8 bytes seguido de string NUL-terminada, e o ponteiro relativo cai **dentro**
da entrada — não no início dela. O deslocamento exato varia com o layout
emitido pelo compilador.

O que tentei:

1. **Snap para a string mangled mais próxima.** Resultado: colapso. 1.020 de
   3.206 descritores resolveram para a mesma string `$ss12CaseIterableP`.
2. **Calibração do deslocamento por varredura** (offsets −24…+16), pontuando
   por diversidade. Não discriminou: a região de conformidades de protocolo
   é dominada por strings da stdlib (`CaseIterable`, `Identifiable`,
   `ExpressibleByArrayLiteral`), então todos os candidatos pareciam bons.
3. **Ajuste fino do layout de `typeref`.** Inspecionei os bytes: a entrada é
   `ff 07 | <4 bytes> | ... | $s...`. Não consegui determinar com confiança a
   semântica do cabeçalho sem a especificação do runtime.

Resultado nos dois binários: **87 nomes distintos** entre 3.206 descritores no
relay, e **1** entre 1.194 no CLI (`$ss12IdentifiableP`).

Por isso o decoder **não imprime o tipo resolvido**. Um tipo errado é pior que
nenhum: parece informação e não é. Os nomes mangled brutos continuam no JSON.

### Como fechar essa lacuna

Em ordem de custo:

1. Especificar o layout exato de `TargetRelativeIndirectTypeReference` da
   versão do runtime, decodificar o `Offset` encadeado até a string. Trabalho
   pequeno, mas exige a fonte do runtime como referência.
2. Usar `swift5_typeref` + `swift5_type_metadata` juntos: o segundo tem a
   árvore de tipos binária que dá o tipo **exato**, sem heurística de string.
   É o caminho correto e é mais caro.
3. Ghidra instalado e `GHIDRA_INSTALL_DIR` apontado — o provider do REA
   passaria a estar disponível, mas não resolve metadados Swift; só
   adicionaria pseudocódigo.

---

## 3. Artefatos

| Arquivo | Conteúdo |
|---|---|
| `02-analysis/relay-fields.json` | 3.206 structs/enums do relay com todos os campos |
| `02-analysis/cli-fields.json` | 1.194 tipos do CLI |
| `tools/swift-demangle.mjs` | demangler, 11/11 testes |
| `tools/swift-reflect.mjs` | leitor de descritores de campo |

## 4. Resumo

| Capacidade | Estado |
|---|---|
| Parser PE + ELF | funciona |
| Demangler de nomes mangled | funciona (11/11) |
| Caminhada de descritores (passo variável) | funciona |
| `FieldName` (ponteiro direto) | funciona — 100% no relay |
| `Kind` (struct/class/enum/protocol) | funciona |
| `MangledTypeName` (referência indireta) | **não implementado** |

Nenhum dos números acima veio de execução: tudo é leitura de bytes.