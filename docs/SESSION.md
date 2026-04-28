# SESSION

Estado atual e tarefas em andamento. Lê no início; atualiza no fim.

## Sessão 2026-04-27 — Docs unificados + backstory da Ayla

### Estado
- ✅ Docs migrados pro padrão `_hub/`: `CLAUDE.md` + `docs/HANDOFF.md` (renomeado de `ficha-rpg-avalon.md`) + `CHANGELOG.md`.
- ✅ Graphify rodado pela 1ª vez (38 nodes / 54 edges / 8 communities).
- ✅ Backstory da Ayla **rascunhada em 3 parágrafos**: origem rua + mercenários, encontro com Sirena (sombras das costas, adoção aos 15), identidade dupla maga/ladina.
- ✅ Idade definida: **19 anos atualmente, 4 anos com a Sirena**.
- ✅ Família Heiman descartada (era só worldbuilding, sem peso na história).

### Em aberto (depende de input externo)

- ⏳ **História da Sirena** — Koda (mestra da mesa) vai mandar pro Lucas. Quando vier, costuro no 2º parágrafo da backstory.
- ⏳ **Aprofundar anos com mercenários** (11-15 anos) — Lucas tem 6 perguntas pra responder (entrada no grupo, tamanho/perfil, laços, saída, se ainda existem hoje, tom).
- ⏳ **Patrono** — campo da ficha em aberto.
- ⏳ **Atributos ÍMPETO/RAZÃO/VÍNCULO/SOMBRAS** — sugiro valores quando narrativa fechar. SOMBRAS pode amarrar com a magia da Sirena (gancho potente).

### Em aberto (manutenção)

- 🔧 **Logo Avalon**: Lucas precisa salvar PNG em `assets/avalon.png` manualmente.
- 🔧 **Validação visual em iPhone real** — só foi testado via DOM dimensions.

---

## Sessão 2026-04-26 — Bootstrap

### Estado
- 3 páginas montadas em HTML/CSS/JS puro (sem build):
  1. **Frente** — identidade horizontal (Nome, Jogador, Raça, Classe, Clã, Patrono) + logo Avalon, 4 escudos verticais à esquerda (ÍMPETO, RAZÃO, VÍNCULO, SOMBRAS, cada um com **número grande no escudo + número pequeno na bolinha**), PV (caveiras + círculo), Armadura (círculo) + Arma Principal (linha), Vínculos, Pets, Itens.
  2. **Energia/Anotações** — logo Avalon centralizado, ENERGIA ARCANA (círculo) + CORRUPÇÃO (4 bolinhas marcáveis), área de anotações em 2 colunas pautadas.
  3. **Habilidades Adquiridas** — logo Avalon centralizado, área grande em 2 colunas pautadas.
- Modo caneta com canvas overlay por página, cor + espessura ajustáveis, borracha, desfazer último traço, limpar tudo.
- Auto-save em localStorage (campos + tinta), com debounce de 350ms e indicador "salvando…/salvo".
- Export/Import JSON (botões na topbar; nome do arquivo usa o campo Nome).
- Reset (apaga tudo).
- PWA: `manifest.webmanifest` + `sw.js` (cache-first). Instalável no celular como app.

### Decisões
- **Stack**: HTML + CSS + JS vanilla. Sem framework, sem build, sem dependências. Justificativa: GitHub Pages serve estático puro; menos complexidade.
- **Logo Avalon**: por enquanto é texto estilizado em CSS. Lucas pode trocar pelo PNG/SVG real depois (basta colocar `assets/avalon.png` e ajustar `index.html`).
- **Hospedagem**: GitHub Pages (URL fixa, grátis, funciona com PC desligado). Não usa o esquema Flask+ngrok do relatorio-motoboy.
- **Sync entre dispositivos**: manual via Exportar/Importar JSON. Não tem backend.
- **Layout**: A4 (proporção 1:1.414) no desktop; empilhado vertical no mobile.

### Em aberto
- **Logo real**: Lucas pode fornecer o PNG do logo Avalon pra substituir o texto.
- **Testar em iPhone real**: layout responsivo testado via DOM dimensions — falta validação visual no aparelho.
- **Screenshot do preview server** está dando timeout (ferramenta interna). Layout validado via getBoundingClientRect.

### Iteração 2 (2026-04-26 noite) — Hosting + sync + páginas extras

- **Stack mudou**: HTML/JS estático → Flask + estáticos + endpoints `/api/state` GET/POST.
- **Hospedagem**: igual ao relatorio-motoboy. Flask local + ngrok com static domain `vitally-anaconda-tarantula.ngrok-free.dev`. Basic Auth opcional (LAN passa livre). Reaproveita `APP_USER`/`APP_PASS`/`NGROK_AUTHTOKEN` do relatorio-motoboy. **Importante**: ngrok free só permite 1 tunnel ativo por authtoken; subir o da ficha mata o do relatorio-motoboy.
- **Sync entre dispositivos**: estado em `data/ficha.json` único (gravação atômica). Cliente puxa do servidor no boot e a cada 8s; salva debounced (450ms) com fallback localStorage offline. Não sobrescreve enquanto o usuário está digitando (guard `document.activeElement`).
- **Visual refeito**: design system inspirado no relatorio-motoboy (Manrope, radius 18px, inset borders sutis), mantendo o feel "papel envelhecido" com Caveat na escrita à mão e Cinzel no logo.
- **Páginas novas**:
  - **Background do personagem** — 4 cards (Aparência, Personalidade, História, Objetivos & Medos).
  - **Encontros** — tabela dinâmica (nome + descrição), botão `✎` abre modal com anotações longas, botão `×` remove. Estado vai em `campos.encontros: [{id,nome,descricao,anotacoes}]`.
  - **Diário de Sessões** — área grande pautada em 2 colunas.
- **Total de 6 páginas**: frente, energia/anotações, habilidades, background, encontros, diário.

### Arquivos críticos
- [index.html](../index.html) — markup das 3 páginas.
- [style.css](../style.css) — todo o visual (responsivo + print).
- [app.js](../app.js) — persistência, canvas, export/import, PWA.
- [manifest.webmanifest](../manifest.webmanifest) + [sw.js](../sw.js) — PWA.
