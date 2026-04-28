# Ficha RPG Avalon — contexto consolidado

Snapshot completo da sessão de bootstrap (2026-04-26 → 27). Lê isso pra retomar o projeto sem precisar repassar tudo.

---

## O que é

Webapp pessoal do **Lucas** pra preencher, marcar e anotar a ficha de RPG do sistema **Avalon**. Roda na máquina dele, exposto pela internet via ngrok com URL fixa. Usado tanto no PC quanto no iPhone, em qualquer rede.

A personagem é **Ayla** — humana, ladina, **19 anos**, 1,60m, cabelos longos dourados (estilo Fern de Frieren). Cresceu nas ruas, recolhida por um grupo de mercenários que a obrigava a roubar pra eles. Aos 15, tentou bater a carteira da maga **Sirena** num beco — Sirena tem sombras que saem das costas e foi com elas que pegou a Ayla. Em vez de punir, Sirena adotou-a; estão juntas há **4 anos**. Ayla usa robe de mago como fachada, mas esconde duas espadas curtas no quadril. Curiosa, tagarela com quem confia, observadora com estranhos. Backstory rascunhada em sessão 27/04 — aguarda **Koda** (mestra da mesa) mandar a história da Sirena pra fechar.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.10+ / Flask (`app.py`) — serve estáticos + endpoints `/api/state` |
| Frontend | HTML + CSS + JS vanilla (sem build, sem framework) |
| Persistência | Arquivo JSON único em `data/ficha.json` (gravação atômica via tmpfile + rename) |
| PWA | `manifest.webmanifest` + `sw.js` (cache versionado por número, network-first p/ estáticos, sempre rede p/ `/api/`) |
| Auth | Basic Auth — LAN passa livre, IP externo precisa `APP_USER`/`APP_PASS` do `.env` |
| Hospedagem | Flask local em `127.0.0.1:5050` + `ngrok http 5050` com static domain |

**URL pública**: https://vitally-anaconda-tarantula.ngrok-free.dev/
**Login**: `lucas` / **Senha**: `12345678`
**Repo**: https://github.com/kar2w/ficha-rpg-avalon (público)

---

## Estrutura

```
ficha-rpg-avalon/
├── Iniciar.bat                ← sobe Flask na 5050
├── app.py                     ← Flask: estáticos + auth + /api/state
├── index.html                 ← markup das 6 abas + 3 modais
├── style.css                  ← visual completo (Manrope/Caveat/Cinzel)
├── app.js                     ← persistência, abas, encontros, itens, formatação
├── manifest.webmanifest       ← PWA
├── sw.js                      ← service worker (cache "ficha-avalon-vN")
├── assets/
│   └── avalon.png             ← logo dourado (Lucas precisa salvar manualmente)
├── data/
│   ├── .env                   ← APP_USER/APP_PASS/NGROK_AUTHTOKEN (gitignored)
│   ├── .env.example
│   └── ficha.json             ← estado salvo (gitignored)
├── scripts/
│   ├── Iniciar-Tunel-Ngrok.bat
│   └── ngrok-multi.yml        ← config 2-tunnels (gitignored, tem authtoken)
└── docs/
    ├── SESSION.md
    ├── CHECKPOINTS.md
    └── CONTEXTO.md            ← este arquivo
```

---

## Navegação (6 abas, sidebar)

Sidebar à esquerda (drawer em mobile, fixa em desktop ≥1100px). Botão `☰` no topo abre o drawer.

Ordem confirmada com o Lucas:
1. 🛡️ **Ficha** (frente do personagem)
2. ✨ **Energia & Anotações** (energia arcana, corrupção, anotações livres)
3. 📜 **Habilidades** (área pautada com formatação)
4. ⚔️ **Encontros** (tabela dinâmica, NPCs/lugares com ícone)
5. 📔 **Diário de sessões** (área pautada grande)
6. 📖 **Background** (área pautada — destinada à backstory)

Ações no FIM da sidebar: **Exportar ficha** / **Importar ficha** / **Resetar tudo** (em vermelho).

---

## Página da Frente (campos)

- **Identidade horizontal** no topo: Nome, Nome do jogador, Raça, Classe, Clã, Patrono. Inputs estilo "pílula" branca arredondada.
- **4 escudos verticais** à esquerda (SVG via background data-URI, formato heater shield):
  - ÍMPETO / RAZÃO / VÍNCULO / SOMBRAS
  - Cada um tem **número grande no centro** (font 38px) + **bolinha à direita com número pequeno** (18px) — _ambos são números, não checkbox_.
- **PV**: círculo grande (font 36px) com 3 caveirinhas SVG marcáveis abaixo.
- **ARMADURA**: círculo grande (mesmo formato).
- **ARMA PRINCIPAL**: textarea com auto-grow (cresce conforme conteúdo) + botão `📜` ao lado do título "ARMA PRINCIPAL" → abre **modal D&D 5e** com 33 armas (busca + categorias). Click preenche `Nome — dano (props)`.
- **VÍNCULOS**, **PETS**: textareas livres.
- **ITENS**: lista dinâmica `{id, nome, descricao}`. Botão **+ Adicionar item**. Cada item: input nome + textarea descrição (auto-grow) + botão `×`.

---

## Editor pautado (formatação)

Páginas de notas (Energia/Anotações, Habilidades, Diário, Background) usam um único **`<div contenteditable>`** com classe `.lined.lined-edit.lined-scroll`:
- Background pautado com `repeating-linear-gradient` a cada 31px.
- `background-attachment: local` → linhas acompanham o scroll do conteúdo.
- `flex: 1; min-height: 0; overflow-y: auto` — rolagem **dentro do bloco**, página em si não rola.
- Caveat 22px, line-height 31px, padding-top 6px (calibração de baseline pra texto pousar na linha).

**Toolbar de formatação** aparece ao focar em qualquer `.lined-edit`:
- `H2` (Cinzel grande dourado), `H3` (Cinzel médio), `B` (negrito), `I` (itálico), `¶` (parágrafo normal)
- Atalhos: `Ctrl+1`, `Ctrl+2`, `Ctrl+B`, `Ctrl+I`
- Em **mobile**: fixa logo abaixo da topbar (`position: fixed; top: var(--topbar-h)`)
- Em **desktop**: também fixed, respeita `body.sidebar-fixed` (left: var(--sidebar-w))
- HTML salvo é **sanitizado** — só permite tags `b/strong/i/em/h2/h3/p/br/div/span`, sem atributos.

---

## Encontros (tabela dinâmica)

Cada encontro: `{id, nome, descricao, anotacoes, icone}`.

Colunas: **avatar** (44px circular) | **Nome** | **Descrição** | **ações** (`✎` notas + `×` remove).

- Click no **avatar** → modal de upload com:
  - Drag & drop ou input file
  - Imagem é cropada quadrada centralizada e redimensionada pra **128×128 JPEG 82%** (canvas)
  - Salva como base64 em `enc.icone` (~5–15 KB)
  - Botão "Remover ícone" pra limpar
- Click no `✎` → modal com textarea grande pra anotações longas (sem formatação, é só textarea simples).

---

## Sync entre dispositivos

`GET /api/state` retorna `{campos, tinta}` — cliente aplica via `aplicarCampos()`.
`POST /api/state` recebe e grava atomicamente. Backend valida que `campos` e `tinta` são objetos.

Cliente:
- **Save debounced** 450 ms após qualquer input.
- **Polling** a cada 8 s puxa do servidor (só se não há mudança local pendente, sem inflight, e usuário não está digitando).
- **Re-check** após `await fetch` antes de aplicar — fecha race condition de delete + polling.
- **Cache localStorage** como fallback offline.

`tinta` é vestígio do antigo sistema de canvas (caneta) — sempre `{}` agora. Backend ainda aceita pra compatibilidade.

---

## Layout / responsividade

Refatoração crítica feita pra **rolagem só dentro do bloco**:
- `html, body { height: 100dvh; overflow: hidden }` (dynamic viewport — conta a barra dinâmica do iOS).
- `body { display: flex; flex-direction: column }` — topbar (auto) + `.pages` (flex 1).
- `.page` é flex column ocupando tudo de `.pages`. Conteúdo (`.page-grid`) com flex/overflow controlado pela presença de `.lined-scroll` (classe explícita `.has-lined-scroll` aplicada via JS no boot — fallback p/ Safari pré-`:has()`).
- **Página da Ficha (frente)** mantém `display: grid` em 4 áreas (identidade / atributos+pv+vínculos / atributos+armadura+pets / itens span).
- **Páginas de notas** são flex column simples: logo + card único contendo título + editor.

**Mobile**: layout cai pra coluna única em ≤480px, escudos viram row em ≤480px, identidade vira coluna única.

---

## Cache PWA (versionado)

`sw.js` tem `const CACHE = "ficha-avalon-vN"`. Cada mudança crítica → bump da versão.
Listener `controllerchange` no client → ao detectar SW novo assumindo controle, reload automático da página.

Histórico: bumpamos do v1 ao **v26** durante esta sessão. Sempre que algo "não atualizou" no celular, era o SW antigo servindo cache.

---

## Bugs notáveis corrigidos

| Bug | Causa | Fix |
|---|---|---|
| Encontro deletado voltava | Polling puxava estado antigo do servidor antes do POST do delete chegar | Flag `temMudancaLocal` + janela de 1s pós-save + re-check após `await` |
| Linhas pautadas não acompanhavam scroll | Background pintado no elemento, conteúdo rolava | `background-attachment: local` |
| Diário não rolava (outras rolavam) | `.lined { overflow: hidden }` declarada DEPOIS de `.lined-scroll { overflow-y: auto }` no CSS — cascade ganhou | Trocou pra `overflow-x: hidden` no `.lined`, deixou o `.lined-scroll` controlar Y |
| Toolbar de formato não aparecia em desktop | Era `position: sticky` mas body com `overflow: hidden` quebra sticky | Trocou pra `position: fixed` em todos os tamanhos |
| Body rolava inteiro em vez do bloco | Topbar sticky + height calc somavam mais que viewport | `100dvh` + `overflow: hidden` no body, page com `flex: 1` |
| Anotações sumiam ao trocar de textarea pra contenteditable | App antigo cached no SW tentou `el.value = x` num div — texto continuou no servidor | Bump cache + sanitização aceita string plana e converte `\n` em `<br>` |
| Botão de armas/itens cortando texto | Input single-line com flex 1 + button competiam | Textarea com auto-grow + botão alinhado ao título via grid |

---

## Pendências (em ordem de importância)

1. **Logo PNG** — Lucas mandou a imagem do logo Avalon dourado mas o Claude não consegue salvar arquivo de chat. Lucas precisa colocar manualmente em `assets/avalon.png`. O markup já espera com fallback texto via `onerror`.
2. **Backstory da Ayla** — Lucas pediu ajuda pra escrever. Aguarda ele passar: idade, motivação, o que cada atributo (ÍMPETO/RAZÃO/VÍNCULO/SOMBRAS) representa, o que é Patrono, tom desejado.
3. **Graphify** — não rodado. Pacote PyPI é `graphifyy` (com 2 y's) — o sandbox bloqueou pip install por suspeita de typosquat (mas é o oficial, [safishamsi/graphify](https://github.com/safishamsi/graphify)). Lucas precisa rodar manual: `pip install graphifyy && graphify install --platform windows`. Depois, em sessão NOVA do Claude Code, rodar `/graphify .`.
4. **Validação visual em iPhone real** — só testado via DOM dimensions e prints que o Lucas mandou.

---

## Comandos úteis

```powershell
# Subir Flask
cd "C:\Users\lucar\OneDrive\Documentos\dev\ficha-rpg-avalon"
python app.py        # ou: Iniciar.bat

# Subir tunnel ngrok (porta 5050)
"C:\Users\lucar\OneDrive\Documentos\dev\relatorio-motoboy\scripts\ngrok.exe" http 5050

# Pegar URL do tunnel
curl -s http://127.0.0.1:4040/api/tunnels

# Bump cache PWA
# editar sw.js: const CACHE = "ficha-avalon-vN+1"

# Testar API
curl -u "lucas:12345678" http://127.0.0.1:5050/api/state
curl -u "lucas:12345678" -X POST -H "Content-Type: application/json" \
  -d '{"campos":{},"tinta":{}}' http://127.0.0.1:5050/api/state

# Push pro GitHub
cd "/c/Users/lucar/OneDrive/Documentos/dev/ficha-rpg-avalon"
git add . && git commit -m "msg" && git push
```

---

## Decisões de produto (registradas com o Lucas)

- **Caneta/rabisco removido** — era um overlay canvas; complicou layout e ele não usava.
- **Páginas Anotações Avulsas (extra1/2/3) removidas** — só atrapalham; quando precisar mais espaço, usa as existentes ou cria sob demanda.
- **Sidebar > tabs/setas** — preferência explícita do Lucas (já vinha do relatorio-motoboy).
- **Background é a última aba** — Lucas pediu nessa ordem específica.
- **Repo público** — não tem dado sensível e Pages free só funciona em público (não que vamos usar GitHub Pages — ficha tem backend).
- **2 contas ngrok separadas** — ficha usa a conta original, relatorio-motoboy migrou pra conta nova do Lucas. Cada um com seu domínio fixo. Antes alternavam, agora coexistem.

---

## Memory relacionado

- `project_ficha_rpg_avalon.md` — memory persistente do projeto.
- `project_relatorio_motoboy.md` — projeto irmão; design system inspirou o visual da ficha.
- `feedback_no_obsidian.md` — não passar `--obsidian` em `/graphify`.
- `feedback_derek_ui_navegacao.md` — sidebar é a navegação preferida.
- `pasta_padrao_projetos.md` — projetos novos em `OneDrive/Documentos/dev/`.
- `tooling_local.md` — gh CLI (kar2w) + graphify + ngrok configs isoladas por projeto.
