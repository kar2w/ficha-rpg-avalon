# Graph Report - ficha-rpg-avalon  (2026-04-27)

## Corpus Check
- 3 files · ~8,323 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 38 nodes · 54 edges · 6 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]

## God Nodes (most connected - your core abstractions)
1. `aplicarCampos()` - 7 edges
2. `setStatus()` - 5 edges
3. `flagDirty()` - 4 edges
4. `salvar()` - 4 edges
5. `lerCampos()` - 4 edges
6. `cacheLocal()` - 3 edges
7. `carregarDoServidor()` - 3 edges
8. `carregarDoCache()` - 3 edges
9. `renderEncontros()` - 3 edges
10. `fecharModal()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `flagDirty()` --calls--> `setStatus()`  [EXTRACTED]
  app.js → app.js  _Bridges community 2 → community 3_
- `salvar()` --calls--> `setStatus()`  [EXTRACTED]
  app.js → app.js  _Bridges community 2 → community 4_

## Communities

### Community 1 - "Community 1"
Cohesion: 0.25
Nodes (1): Servidor da Ficha Avalon: serve estáticos + sync de estado.  Auth: Basic Auth op

### Community 2 - "Community 2"
Cohesion: 0.4
Nodes (6): aplicarCampos(), carregarDoCache(), carregarDoServidor(), migrarLegado(), renderItens(), setStatus()

### Community 3 - "Community 3"
Cohesion: 0.5
Nodes (4): aplicarFormato(), fecharModal(), flagDirty(), renderEncontros()

### Community 4 - "Community 4"
Cohesion: 0.67
Nodes (4): cacheLocal(), lerCampos(), salvar(), syncPull()

### Community 5 - "Community 5"
Cohesion: 1.0
Nodes (2): abrirModalArmas(), renderArmas()

### Community 6 - "Community 6"
Cohesion: 1.0
Nodes (2): abrirSidebar(), mostrarAba()

## Knowledge Gaps
- **1 isolated node(s):** `Servidor da Ficha Avalon: serve estáticos + sync de estado.  Auth: Basic Auth op`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 1`** (8 nodes): `criar_app()`, `_eh_lan()`, `_gravar_estado()`, `_ip_real()`, `_ler_env()`, `_ler_estado()`, `app.py`, `Servidor da Ficha Avalon: serve estáticos + sync de estado.  Auth: Basic Auth op`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 5`** (2 nodes): `abrirModalArmas()`, `renderArmas()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (2 nodes): `abrirSidebar()`, `mostrarAba()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `aplicarCampos()` connect `Community 2` to `Community 0`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `setStatus()` connect `Community 2` to `Community 0`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `flagDirty()` connect `Community 3` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `Servidor da Ficha Avalon: serve estáticos + sync de estado.  Auth: Basic Auth op` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._