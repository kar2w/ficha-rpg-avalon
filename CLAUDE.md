# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é

Webapp pessoal do Lucas pra ficha de RPG (sistema **Avalon**). Roda Flask local, exposto via ngrok com URL fixa. Personagem: Ayla, ladina humana da família Heiman. Usado no PC e iPhone.

**Sempre ler `docs/HANDOFF.md` no início de uma nova sessão e `docs/SESSION.md` pra estado vivo.**

## Comandos

```powershell
# Subir Flask (porta 5050)
Iniciar.bat                     # ou: python app.py

# Subir tunnel ngrok (reusa o ngrok.exe do relatorio-motoboy)
"C:\Users\lucar\OneDrive\Documentos\dev\relatorio-motoboy\scripts\ngrok.exe" http 5050

# Pegar URL
curl -s http://127.0.0.1:4040/api/tunnels

# Bump cache PWA (depois de mudar HTML/CSS/JS)
# editar sw.js: const CACHE = "ficha-avalon-vN+1"

# Testar API
curl -u "lucas:12345678" http://127.0.0.1:5050/api/state
```

Sem build/test/lint — Flask puro + Tailwind via CDN + vanilla JS.

## Arquitetura

```
Flask (app.py)  ─┐
                 ├─ /          → estáticos (index.html, app.js, style.css, sw.js)
                 ├─ /api/state → GET retorna {campos, tinta} | POST grava atomicamente
                 └─ Basic Auth → LAN livre, externo pede APP_USER/APP_PASS

Persistência: data/ficha.json (gravação atômica via tmpfile + rename)

Frontend (vanilla JS):
  - 6 abas com sidebar (drawer mobile, fixa desktop ≥1100px)
  - Save debounced 450ms após input
  - Polling 8s (com guard pra mudança local pendente + race condition após await)
  - Cache localStorage como fallback offline

PWA:
  - manifest.webmanifest
  - sw.js com `const CACHE = "ficha-avalon-vN"` (bump versão a cada mudança crítica)
  - controllerchange listener → reload automático quando SW novo assume
```

### 6 abas (ordem fixada com Lucas)

1. 🛡️ Ficha (frente do personagem)
2. ✨ Energia & Anotações
3. 📜 Habilidades
4. ⚔️ Encontros (tabela dinâmica com avatar 128×128 base64)
5. 📔 Diário de sessões
6. 📖 Background

### Editor pautado

`<div contenteditable>` com classe `.lined.lined-edit.lined-scroll`:
- `repeating-linear-gradient` a cada 31px (linhas)
- `background-attachment: local` (linhas acompanham scroll)
- Caveat 22px, line-height 31px, padding-top 6px
- Toolbar: `H2 H3 B I ¶` + atalhos `Ctrl+1/2/B/I`
- HTML salvo é sanitizado (só `b/strong/i/em/h2/h3/p/br/div/span`, sem atributos)

## Convenções críticas

- **Sidebar > tabs/setas** (preferência do Lucas; nunca usar setas anterior/próxima)
- **`100dvh + overflow:hidden` no body** — rolagem só dentro dos blocos `.lined-scroll`
- **Bump do CACHE no `sw.js`** sempre que mudar HTML/CSS/JS crítico (senão celular serve cache antigo)
- **`ficha.json` é a fonte da verdade** (não localStorage; este só fallback offline)
- **Background é a última aba** (decisão explícita do Lucas)
- **Sem `--obsidian` no graphify** (vault gera feedback loop)
- **Repo público** (sem dado sensível)

## Datas

Sempre **horário de Brasília (UTC-3)**.

## Sync race condition (importante)

Polling de 8s pode puxar estado antigo do servidor entre o user editar e o save chegar. Defensa em camadas:
1. Flag `temMudancaLocal` quando user digita
2. Janela de 1s pós-save bloqueando aplicação de polling
3. Re-check após `await fetch` antes de aplicar

Já corrigiu bug de "encontro deletado voltava" — não desabilitar essas guards.

## Estrutura

```
ficha-rpg-avalon/
├── CLAUDE.md             ← este arquivo
├── Iniciar.bat
├── app.py                ← Flask + auth + /api/state
├── index.html            ← markup das 6 abas + 3 modais
├── style.css             ← Manrope/Caveat/Cinzel + paleta dourada
├── app.js                ← persistência, abas, encontros, formatação
├── manifest.webmanifest
├── sw.js                 ← cache "ficha-avalon-vN"
├── assets/
│   └── avalon.png        ← logo (Lucas precisa salvar manualmente)
├── data/
│   ├── .env              ← APP_USER/APP_PASS/NGROK_AUTHTOKEN (gitignored)
│   ├── .env.example
│   └── ficha.json        ← estado salvo (gitignored)
├── scripts/
│   ├── Iniciar-Tunel-Ngrok.bat
│   └── ngrok-multi.yml   ← config 2-tunnels (gitignored)
└── docs/
    ├── HANDOFF.md        ← contexto completo (LER NO INÍCIO)
    ├── SESSION.md        ← estado vivo (LER NO INÍCIO)
    └── CHECKPOINTS.md    ← histórico append-only
```

## URLs

- **Local**: http://127.0.0.1:5050
- **Externo (ngrok)**: https://vitally-anaconda-tarantula.ngrok-free.dev/
- **Login externo**: `lucas` / `12345678`
- **Repo**: https://github.com/kar2w/ficha-rpg-avalon (público)
