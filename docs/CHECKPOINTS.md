# CHECKPOINTS

Marcos atingidos. Append-only.

## 2026-04-28 — Logo Avalon gravada + fundo transparente + cache v27

**Contexto:** Lucas mandou o PNG da logo Avalon no chat. Antes era pendência aberta — eu (Claude) não conseguia gravar imagem do chat em disco.

**Decisão/Descoberta:**
- Truque novo: `~/.claude/projects/<dir>/<session-id>.jsonl` armazena cada turno em JSONL, incluindo imagens enviadas como `type: image, source.media_type: image/png, source.data: <base64>`. Extraí com Python+`json.loads`+`base64.b64decode`, gravei em `assets/avalon.png` (212 KB).
- 1ª versão tinha fundo bege opaco `(230,225,214)` — ficava como cartão recortado contra a paleta papel envelhecido.
- Fix: flood fill (PIL) desde os 4 cantos com tolerância 18 por canal → 70% dos pixels viraram transparentes. Logo agora flutua.
- Cache PWA bumpado de v26 → v27 pra forçar `controllerchange` + reload no celular.

**Por quê:** logo era a única coisa visual quebrando a paleta. Resolver fechou a estética da ficha.

**Pendência nova:** Lucas pediu logo "um pouco maior" (anotado em `project_pending_decisions.md` na memory).

---

## 2026-04-27 — Backstory da Ayla rascunhada

**Contexto:** Lucas pediu ajuda pra escrever a backstory da personagem.

**Decisão/Descoberta:** 3 parágrafos rascunhados cobrindo origem (rua + mercenários), encontro com Sirena (sombras saindo das costas, adoção aos 15) e identidade dupla (maga por aparência, ladina de fato). Idade definida: **19 anos atual, 4 anos com a Sirena**.

**Em aberto:**
- História da **Sirena** — aguarda **Koda** (mestra da mesa) mandar.
- Aprofundamento dos anos com mercenários (11-15 anos) — Lucas vai responder 6 perguntas direcionadas que mandei.
- Atributo **SOMBRAS** pode ter conexão temática com Sirena (eco do treino) — fica em standby até Koda confirmar magia da mestra.
- **Patrono** — campo da ficha em aberto.

**Por quê:** material de mesa precisa estar pronto pra Lucas usar; mas a história da Sirena depende da Koda, então rascunho ficou em parágrafos modulares (fácil ajustar 2º parágrafo quando vier).

---

## 2026-04-27 — Família Heiman descartada

**Contexto:** Memory + HANDOFF mencionavam "vinculada à família Heiman (Vale do Silisto)".

**Decisão:** Removido. Lucas esclareceu que Heiman é só worldbuilding (ducado descoberto durante sessão) — não tem relevância na história da Ayla.

**Por quê:** evitar costurar narrativa em torno de detalhe sem peso; deixar foco em rua → mercenários → Sirena.

---

## 2026-04-27 — Docs migrados pro padrão unificado + CLAUDE.md

**Contexto:** Hub global criado em `_hub/` indexando os 4 projetos locais.

**Decisão:** `docs/ficha-rpg-avalon.md` renomeado pra `docs/HANDOFF.md` (padronização cross-project). Adicionado `CLAUDE.md` raiz e `CHANGELOG.md`. Graphify rodado pela 1ª vez (38 nodes).

**Por quê:** padroniza com os outros 3 projetos locais — mesmo protocolo de início/fim de sessão, mesmo formato de docs.

---

## 2026-04-26 — Bootstrap
- Estrutura de pastas + docs criadas em `OneDrive/Documentos/dev/ficha-rpg-avalon/`.
- 3 páginas (frente + energia/anotações + habilidades) reproduzindo o layout da ficha física do sistema Avalon.
- 4 escudos com **número no centro + número na bolinha** (após correção: bolinhas inicialmente eram checkbox, viraram input numérico).
- PV com 3 caveirinhas marcáveis + círculo de total.
- Armadura, Energia Arcana com círculo numérico.
- Corrupção com 4 bolinhas marcáveis.
- Anotações e Habilidades em textareas pautadas (2 colunas).
- Modo caneta (canvas overlay) com cor, espessura, borracha, desfazer, limpar.
- Auto-save em localStorage. Export/Import JSON. Reset total.
- PWA (manifest + service worker cache-first).
- Layout responsivo: A4 desktop, empilhado mobile.

## 2026-04-26 (noite) — Hosting + sync + 3 páginas extras
- Migrado de estático puro pra Flask (`app.py`) com Basic Auth (auth no padrão do relatorio-motoboy).
- Hosting via ngrok com static domain `vitally-anaconda-tarantula.ngrok-free.dev` (mesmas credenciais do relatorio-motoboy).
- Sync entre dispositivos via `/api/state` (estado único em `data/ficha.json`).
- Visual refeito com design system do relatorio-motoboy (Manrope + radius + inset borders) mantendo o feel de papel.
- Página **Background do personagem** com 4 cards (Aparência/Personalidade/História/Objetivos).
- Página **Encontros**: tabela dinâmica + modal de anotações por encontro.
- Página **Diário de Sessões** em 2 colunas pautadas.
- Service worker ajustado pra ignorar `/api/*` (sync precisa rede sempre).
