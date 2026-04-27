# CHECKPOINTS

Marcos atingidos. Append-only.

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
