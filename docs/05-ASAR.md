# ASAR â€” empacotador e verificador

Fecha o ciclo entre ler e modificar o app. Duas ferramentas novas em `tools/`:

| Arquivo | Papel |
|---|---|
| `asar-pack.mjs` | empacota uma Ã¡rvore de diretÃ³rios em um `.asar` |
| `asar-verify.mjs` | compara dois `.asar` entrada a entrada por SHA-256 |

---

## 1. Formato, medido no artefato real

Confirmado lendo os bytes do `app.asar` do Maestri (11.639 entradas):

```
offset 0    uint32   4
offset 4    uint32   lenJSON + 8
offset 8    uint32   lenJSON + 4
offset 12   uint32   lenJSON
offset 16   bytes    JSON do header
offset 16 + lenJSON   dados dos arquivos
```

Pontos que sÃ³ a leitura do binÃ¡rio revela:

- **NÃ£o hÃ¡ padding.** `base = 16 + lenJSON` exatamente.
- **NÃ£o hÃ¡ alinhamento entre arquivos.** Os dados sÃ£o contÃ­guos a partir do
  offset 0, sem gaps (verificado nos 11.601 arquivos).
- **`offset` Ã© serializado como string** no JSON (`"offset":"137787739"`),
  nÃ£o como nÃºmero. O Electron usa `Number()` na leitura, entÃ£o ambos
  funcionam, mas Ã© preciso manter a convenÃ§Ã£o para comparaÃ§Ã£o byte a byte.
- **Entradas `unpacked` nÃ£o tÃªm `offset`**: sÃ£o
  `{"size":â€¦,"unpacked":true,"integrity":{â€¦}}`. O Electron as resolve em
  tempo de execuÃ§Ã£o a partir do diretÃ³rio irmÃ£o `app.asar.unpacked/`.
- **`integrity` Ã© SHA-256 com blocos de 4 MiB** (`blockSize: 4194304`) e a
  lista `blocks` traz um hash por bloco.

DiferenÃ§a entre o original e o reproduzido: **âˆ’450 bytes** (3.011.184 â†’ 3.010.734
de header). Ã‰ a ordem das chaves no JSON do header, nÃ£o conteÃºdo.

---

## 2. Teste de ida e volta â€” resultado

Remontar o ASAR a partir dos arquivos extraÃ­dos e comparar com o original:

```
entradas  original=11639  reproduzido=11639

conteudo identico      : 11601
hash diferente         : 0
tamanho diferente      : 0
unpacked/link          : 38
ausentes no reproduzido: 0

RESULTADO: IDENTICO
```

Todos os 11.601 arquivos empacotados tÃªm SHA-256 idÃªntico ao original.

Comando:

```powershell
node tools\asar-pack.mjs `
  "01-extracted\asar-src" `
  "02-analysis\roundtrip\app.asar" `
  --order-from "01-extracted\app-64\resources\app.asar"

node tools\asar-verify.mjs `
  "01-extracted\app-64\resources\app.asar" `
  "02-analysis\roundtrip\app.asar"
```

Tempo de empacotamento: ~5 s para 134 MB.

---

## 3. `--order-from`: por que existe

Sem ele, o empacotador ordena os arquivos alfabeticamente e **perde as flags
`unpacked`**. O resultado seria um ASAR sem as 38 entradas do `node-pty`, e o
app quebraria ao tentar carregar `conpty.dll`.

Com `--order-from`, o empacotador:

1. lÃª o header do ASAR original
2. segue a **ordem exata** dos arquivos
3. herda `unpacked` e `link` de cada entrada
4. acrescenta ao fim os arquivos que nÃ£o existiam no original

O resultado Ã© determinÃ­stico: reempacotar sem editar nada devolve o original.

---

## 4. O que descobri no caminho (e o que quase quebrou)

**`app.asar.unpacked` precisa ser mesclado na Ã¡rvore, nÃ£o aninhado.**

Meu `asar-extract.mjs` nÃ£o extrai arquivos `unpacked` â€” eles vivem no diretÃ³rio
irmÃ£o. Na primeira tentativa de empacotar, copiei essa pasta para dentro de
`asar-src` e o resultado foi **0 arquivos unpacked**: os caminhos ficaram
`app.asar.unpacked/node_modules/â€¦` em vez de `node_modules/â€¦`, e nenhuma entrada
casou com o original.

CorreÃ§Ã£o: mesclar o *conteÃºdo* de `app.asar.unpacked` diretamente em
`asar-src/`. Isso jÃ¡ foi feito â€” `01-extracted/asar-src/` agora contÃ©m os 38
arquivos nativos.

**ConsequÃªncia prÃ¡tica:** para reconstruir uma Ã¡rvore completa, Ã© preciso ter o
`app.asar.unpacked` do lado do `app.asar` original. No nosso caso existe em
`01-extracted/app-64/resources/app.asar.unpacked/`.

---

## 5. Fluxo completo de modificaÃ§Ã£o

```powershell
# 1. extrair (jÃ¡ feito)
node tools\asar-extract.mjs "â€¦\resources\app.asar" "01-extracted\asar-src"

# 2. mesclar os arquivos nativos
Copy-Item "â€¦\resources\app.asar.unpacked\*" "01-extracted\asar-src" -Recurse -Force

# 3. editar o que quiser em 01-extracted\asar-src

# 4. reempacotar
node tools\asar-pack.mjs "01-extracted\asar-src" "â€¦\resources\app.asar" `
     --order-from "<backup>\app.asar"

# 5. conferir
node tools\asar-verify.mjs "<backup>\app.asar" "â€¦\resources\app.asar"
```

O `app.asar.unpacked` **nÃ£o** Ã© gerado pelo empacotador: ele jÃ¡ precisa estar
no lugar ao lado do `app.asar` novo.

---

## 6. Sobre a validaÃ§Ã£o de integridade

Verifiquei os fuses do Electron com `inspect_electron_fuses`:

| Fuse | Estado |
|---|---|
| `EnableEmbeddedAsarIntegrityValidation` | **disabled** |
| `OnlyLoadAppFromAsar` | disabled |
| `RunAsNode` | enabled |
| `EnableNodeCliInspectArguments` | enabled |

O fuse de integridade estÃ¡ desligado, entÃ£o um ASAR remontado Ã© aceito mesmo sem
os hashes. Ainda assim o empacotador **calcula e grava `integrity`** em cada
arquivo, no mesmo formato do original (SHA-256, blocos de 4 MiB). Custa pouco e
torna o empacotador correto mesmo que o fuse seja ligado.

ObservaÃ§Ã£o: fuse desligado significa que o app **nÃ£o** verifica que o ASAR nÃ£o
foi alterado depois da construÃ§Ã£o. Isso Ã© fato do artefato, nÃ£o recomendaÃ§Ã£o.

---

## 7. LimitaÃ§Ãµes

- **Sem symlinks.** O ASAR original nÃ£o usa `link` (verificado: 0 entradas), e o
  empacotador ignora symlinks na Ã¡rvore de entrada.
- **Sem execuÃ§Ã£o.** O resultado foi validado por SHA-256 contra o original, nÃ£o
  por execuÃ§Ã£o do app. Identidade de bytes Ã© condiÃ§Ã£o necessÃ¡ria, nÃ£o
  suficiente para provar que o app carrega â€” embora, com a estrutura preservada,
  seja o que se pode afirmar sem rodar nada.
- **MÃ³dulos nativos** (`node_modules/node-pty`) continuamDepending de
  `app.asar.unpacked`; o empacotador nÃ£o os embute.
- Ferramentas de debug (`dbg-*.mjs`) foram removidas ao final.