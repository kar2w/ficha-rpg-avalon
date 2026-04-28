# Changelog — ficha-rpg-avalon

Histórico de mudanças. Mais novo no topo.

---

## 2026-04-27 — Docs unificados + graphify + backstory

- Adicionado `CLAUDE.md` raiz seguindo padrão dos outros projetos locais.
- `docs/CONTEXTO.md` renomeado pra `docs/HANDOFF.md` (padronização cross-project).
- Graphify rodado: 38 nodes / 54 edges / 8 communities em `graphify-out/`.
- **Backstory da Ayla** rascunhada em sessão (3 parágrafos): origem nas ruas, encontro com Sirena (sombras saindo das costas), identidade dupla maga/ladina. Aguarda Koda mandar história da Sirena pra fechar.
- Idade da Ayla definida: **19 anos**, há 4 anos com a Sirena (adoção aos 15).

---

## 2026-04-27 — Sessão de polidez + GitHub

- Repo público criado em `github.com/kar2w/ficha-rpg-avalon`.
- Cache PWA bumpado pra v26 ao longo da sessão.

---

## 2026-04-26 — Iteração 2: hosting + sync + páginas extras

- Stack mudou: HTML/JS estático → Flask + endpoints `/api/state` GET/POST.
- Hospedagem via ngrok com static domain `vitally-anaconda-tarantula.ngrok-free.dev`.
- Basic Auth: LAN livre, IP externo pede `APP_USER`/`APP_PASS` (mesmas creds do relatorio-motoboy).
- Sync entre dispositivos via `data/ficha.json` único (atomic write).
- Cliente: poll 8s + save debounced 450ms + cache localStorage offline.
- Race condition do sync corrigida (flag `temMudancaLocal` + janela de 1s pós-save + re-check após `await`).
- 6 abas: Ficha / Energia & Anotações / Habilidades / Encontros / Diário / Background.
- Editor pautado com `repeating-linear-gradient` 31px + `background-attachment: local`.
- Encontros com avatar 128×128 base64 cropado via canvas.
- Toolbar de formatação (`H2 H3 B I ¶`) fixed em mobile e desktop.
- Cache PWA versionado (`ficha-avalon-vN`); `controllerchange` listener faz reload automático.

---

## 2026-04-26 — Bootstrap

- 3 páginas iniciais: Frente, Energia/Anotações, Habilidades.
- Modo caneta (canvas overlay), auto-save localStorage debounced.
- Export/Import JSON.
- PWA (manifest + sw.js cache-first).

---

## Decisões importantes (resumo)

- **Caneta/rabisco removido** — overlay canvas atrapalhava layout, Lucas não usava.
- **Páginas Anotações Avulsas removidas** — só atrapalham; usar as existentes.
- **Sidebar > tabs/setas** — preferência explícita do Lucas (recusou setas).
- **Background é a última aba** — ordem fixada com Lucas.
- **Repo público** — não tem dado sensível.
- **2 contas ngrok separadas** — ficha usa a original, relatorio-motoboy migrou pra conta nova.
