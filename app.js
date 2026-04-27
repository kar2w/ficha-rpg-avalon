"use strict";

const STORAGE_KEY = "ficha-avalon:v3";
const API = "/api/state";

/* ===== Persistência (servidor + localStorage como cache offline) ===== */

const status = document.getElementById("save-status");
let saveTimer = null;
let inflight = null;
let needsAnotherSave = false;
let temMudancaLocal = false;
let ultimaSaveOk = 0;

function setStatus(txt, cls) {
  status.textContent = txt;
  status.classList.remove("saving", "offline", "ok");
  if (cls) status.classList.add(cls);
}

function flagDirty() {
  temMudancaLocal = true;
  setStatus("salvando…", "saving");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(salvar, 450);
}

async function salvar() {
  cacheLocal();
  if (inflight) {
    needsAnotherSave = true;
    return;
  }
  const payload = { campos: lerCampos(), tinta: {} };
  try {
    inflight = fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const res = await inflight;
    if (!res.ok) throw new Error("HTTP " + res.status);
    setStatus("salvo", "ok");
    ultimaSaveOk = Date.now();
  } catch (err) {
    console.warn("Falha ao salvar no servidor; mantido em cache local", err);
    setStatus("offline (cache)", "offline");
  } finally {
    inflight = null;
    if (needsAnotherSave) {
      needsAnotherSave = false;
      salvar();
    } else {
      temMudancaLocal = false;
    }
  }
}

/* Sanitiza HTML do editor: só deixa b, strong, i, em, h2, h3, p, br, div, span. */
const TAGS_OK = new Set(["B","STRONG","I","EM","H2","H3","P","BR","DIV","SPAN"]);
function sanitizarHtml(html) {
  if (!html) return "";
  if (typeof html === "string" && !/<\w/.test(html)) {
    return html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  }
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  (function walk(node) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType !== 1) return;
      if (!TAGS_OK.has(child.tagName)) {
        while (child.firstChild) node.insertBefore(child.firstChild, child);
        node.removeChild(child);
        return;
      }
      [...child.attributes].forEach((a) => child.removeAttribute(a.name));
      walk(child);
    });
  })(tmp);
  return tmp.innerHTML;
}

function lerCampos() {
  const data = {};
  document.querySelectorAll("[data-field]").forEach((el) => {
    const key = el.dataset.field;
    if (el.type === "checkbox") data[key] = el.checked;
    else if (el.isContentEditable) data[key] = sanitizarHtml(el.innerHTML);
    else data[key] = el.value;
  });
  data.encontros = encontros;
  data.itens = itens;
  return data;
}

/* Migra estado legado: campos antigos `<X>_a` / `<X>_b` viraram um só `<X>`. */
function migrarLegado(data) {
  const pares = ["anotacoes", "habilidades", "diario"];
  // Limpa campos de páginas removidas (extra1/2/3) - dados se perdem no próximo save
  ["extra1", "extra2", "extra3"].forEach((k) => {
    delete data[k]; delete data[k + "_a"]; delete data[k + "_b"];
  });
  pares.forEach((dest) => {
    if (data[dest]) return;
    const a = data[dest + "_a"];
    const b = data[dest + "_b"];
    if (a || b) {
      data[dest] = (a || "") + (a && b ? "\n\n" : "") + (b || "");
    }
    delete data[dest + "_a"];
    delete data[dest + "_b"];
  });
  return data;
}

function aplicarCampos(data) {
  if (!data) return;
  data = migrarLegado(data);
  document.querySelectorAll("[data-field]").forEach((el) => {
    const key = el.dataset.field;
    if (!(key in data)) return;
    if (el.type === "checkbox") el.checked = !!data[key];
    else if (el.isContentEditable) el.innerHTML = sanitizarHtml(data[key] ?? "");
    else el.value = data[key] ?? "";
  });
  if (Array.isArray(data.encontros)) {
    encontros.length = 0;
    data.encontros.forEach((e) => encontros.push(e));
  } else {
    encontros.length = 0;
  }
  if (Array.isArray(data.itens)) {
    itens.length = 0;
    data.itens.forEach((i) => itens.push(i));
  } else {
    itens.length = 0;
  }
  renderEncontros();
  renderItens();
  // após carregar, recalcula altura do textarea da arma principal
  setTimeout(ajustarArma, 0);
}

function cacheLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lerCampos()));
  } catch (e) { /* quota */ }
}

async function carregarDoServidor() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (data.campos) aplicarCampos(data.campos);
    setStatus("salvo", "ok");
    return true;
  } catch (err) {
    console.warn("Falha ao carregar do servidor; usando cache local", err);
    return false;
  }
}

function carregarDoCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) aplicarCampos(JSON.parse(raw));
    setStatus("offline (cache)", "offline");
  } catch (e) { /* nada salvo */ }
}

document.querySelectorAll("[data-field]").forEach((el) => {
  el.addEventListener("input", flagDirty);
  el.addEventListener("change", flagDirty);
});

function novoId() {
  return (crypto && crypto.randomUUID) ? crypto.randomUUID() : `e-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
}

/* ===== Itens (lista dinâmica) ===== */
const itens = [];
const itensLista = document.getElementById("itens-lista");

function renderItens() {
  itensLista.innerHTML = "";
  if (itens.length === 0) {
    const empty = document.createElement("div");
    empty.className = "itens-vazio";
    empty.textContent = "Nenhum item ainda.";
    itensLista.appendChild(empty);
    return;
  }
  itens.forEach((item) => {
    const row = document.createElement("div");
    row.className = "item-row";
    row.dataset.id = item.id;

    const inpNome = document.createElement("input");
    inpNome.type = "text";
    inpNome.className = "item-nome";
    inpNome.placeholder = "Nome";
    inpNome.value = item.nome || "";
    inpNome.addEventListener("input", () => { item.nome = inpNome.value; flagDirty(); });

    const inpDesc = document.createElement("textarea");
    inpDesc.className = "item-desc";
    inpDesc.placeholder = "Descrição";
    inpDesc.rows = 1;
    inpDesc.value = item.descricao || "";
    const ajustarDesc = () => {
      inpDesc.style.height = "auto";
      inpDesc.style.height = inpDesc.scrollHeight + "px";
    };
    inpDesc.addEventListener("input", () => {
      item.descricao = inpDesc.value;
      ajustarDesc();
      flagDirty();
    });
    setTimeout(ajustarDesc, 0);

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = "btn-iconish del";
    btnDel.title = "Remover";
    btnDel.textContent = "×";
    btnDel.addEventListener("click", () => {
      const idx = itens.findIndex((x) => x.id === item.id);
      if (idx >= 0) itens.splice(idx, 1);
      renderItens();
      flagDirty();
    });

    row.appendChild(inpNome);
    row.appendChild(inpDesc);
    row.appendChild(btnDel);
    itensLista.appendChild(row);
  });
}

document.getElementById("btn-add-item").addEventListener("click", () => {
  itens.push({ id: novoId(), nome: "", descricao: "" });
  renderItens();
  const last = itensLista.querySelector(".item-row:last-child .item-nome");
  if (last) last.focus();
  flagDirty();
});

/* ===== Armas D&D 5e (modal de seleção) ===== */
const ARMAS_DND = [
  { cat: "Simples — corpo a corpo", nome: "Adaga",            dano: "1d4 perfurante",  props: "Acuidade, Leve, Arremesso (6/18m)" },
  { cat: "Simples — corpo a corpo", nome: "Bordão",           dano: "1d6 contundente", props: "Versátil (1d8)" },
  { cat: "Simples — corpo a corpo", nome: "Clava",            dano: "1d4 contundente", props: "Leve" },
  { cat: "Simples — corpo a corpo", nome: "Foice (Sickle)",   dano: "1d4 cortante",    props: "Leve" },
  { cat: "Simples — corpo a corpo", nome: "Lança",            dano: "1d6 perfurante",  props: "Arremesso (6/18m), Versátil (1d8)" },
  { cat: "Simples — corpo a corpo", nome: "Maça",             dano: "1d6 contundente", props: "—" },
  { cat: "Simples — corpo a corpo", nome: "Maça-estrela",     dano: "1d6 contundente", props: "—" },
  { cat: "Simples — corpo a corpo", nome: "Martelo Leve",     dano: "1d4 contundente", props: "Leve, Arremesso (6/18m)" },
  { cat: "Simples — corpo a corpo", nome: "Porrete",          dano: "1d8 contundente", props: "Duas mãos" },
  { cat: "Simples — distância",     nome: "Arco Curto",       dano: "1d6 perfurante",  props: "Munição (24/96m), Duas mãos" },
  { cat: "Simples — distância",     nome: "Besta Leve",       dano: "1d8 perfurante",  props: "Munição (24/96m), Carregar, Duas mãos" },
  { cat: "Simples — distância",     nome: "Dardo",            dano: "1d4 perfurante",  props: "Acuidade, Arremesso (6/18m)" },
  { cat: "Simples — distância",     nome: "Funda",            dano: "1d4 contundente", props: "Munição (9/36m)" },
  { cat: "Marcial — corpo a corpo", nome: "Alabarda",         dano: "1d10 cortante",   props: "Pesada, Alcance, Duas mãos" },
  { cat: "Marcial — corpo a corpo", nome: "Cimitarra",        dano: "1d6 cortante",    props: "Acuidade, Leve" },
  { cat: "Marcial — corpo a corpo", nome: "Espada Curta",     dano: "1d6 perfurante",  props: "Acuidade, Leve" },
  { cat: "Marcial — corpo a corpo", nome: "Espada Larga",     dano: "1d6 cortante",    props: "Versátil (1d8)" },
  { cat: "Marcial — corpo a corpo", nome: "Espada Longa",     dano: "1d8 cortante",    props: "Versátil (1d10)" },
  { cat: "Marcial — corpo a corpo", nome: "Floreto",          dano: "1d8 perfurante",  props: "Acuidade" },
  { cat: "Marcial — corpo a corpo", nome: "Glaive",           dano: "1d10 cortante",   props: "Pesada, Alcance, Duas mãos" },
  { cat: "Marcial — corpo a corpo", nome: "Lança Montada",    dano: "1d12 perfurante", props: "Alcance, Especial" },
  { cat: "Marcial — corpo a corpo", nome: "Machadinha",       dano: "1d6 cortante",    props: "Leve, Arremesso (6/18m)" },
  { cat: "Marcial — corpo a corpo", nome: "Machado de Batalha", dano: "1d8 cortante",  props: "Versátil (1d10)" },
  { cat: "Marcial — corpo a corpo", nome: "Machado Grande",   dano: "1d12 cortante",   props: "Pesada, Duas mãos" },
  { cat: "Marcial — corpo a corpo", nome: "Mangual",          dano: "1d8 contundente", props: "—" },
  { cat: "Marcial — corpo a corpo", nome: "Martelo de Guerra", dano: "1d8 contundente",props: "Versátil (1d10)" },
  { cat: "Marcial — corpo a corpo", nome: "Marreta",          dano: "2d6 contundente", props: "Pesada, Duas mãos" },
  { cat: "Marcial — corpo a corpo", nome: "Picareta de Guerra", dano: "1d8 perfurante",props: "—" },
  { cat: "Marcial — corpo a corpo", nome: "Tridente",         dano: "1d6 perfurante",  props: "Arremesso (6/18m), Versátil (1d8)" },
  { cat: "Marcial — distância",     nome: "Arco Longo",       dano: "1d8 perfurante",  props: "Munição (45/180m), Pesada, Duas mãos" },
  { cat: "Marcial — distância",     nome: "Besta de Mão",     dano: "1d6 perfurante",  props: "Munição (9/36m), Leve, Carregar" },
  { cat: "Marcial — distância",     nome: "Besta Pesada",     dano: "1d10 perfurante", props: "Munição (30/120m), Pesada, Carregar, Duas mãos" },
  { cat: "Marcial — distância",     nome: "Rede",             dano: "—",               props: "Especial, Arremesso (1,5/4,5m)" },
];

const modalArmas = document.getElementById("modal-armas");
const armasLista = document.getElementById("armas-lista");
const armasBusca = document.getElementById("armas-busca");
const armaInput = document.querySelector('[data-field="arma_principal"]');

function ajustarArma() {
  if (!armaInput || armaInput.tagName !== "TEXTAREA") return;
  armaInput.style.height = "auto";
  armaInput.style.height = armaInput.scrollHeight + "px";
}
if (armaInput) {
  armaInput.addEventListener("input", ajustarArma);
  // Quando aplica do servidor (boot) e quando o user reseleciona, recalcula
  setTimeout(ajustarArma, 0);
}

function renderArmas(filtro = "") {
  armasLista.innerHTML = "";
  const f = filtro.trim().toLowerCase();
  let categoriaAtual = null;
  ARMAS_DND.forEach((a) => {
    const txt = (a.nome + " " + a.dano + " " + a.props + " " + a.cat).toLowerCase();
    if (f && !txt.includes(f)) return;
    if (a.cat !== categoriaAtual) {
      categoriaAtual = a.cat;
      const h = document.createElement("div");
      h.className = "arma-cat";
      h.textContent = a.cat;
      armasLista.appendChild(h);
    }
    const row = document.createElement("button");
    row.type = "button";
    row.className = "arma-row";
    row.innerHTML = `
      <span class="arma-nome">${a.nome}</span>
      <span class="arma-dano">${a.dano}</span>
      <span class="arma-props">${a.props}</span>
    `;
    row.addEventListener("click", () => {
      armaInput.value = `${a.nome} — ${a.dano}` + (a.props && a.props !== "—" ? ` (${a.props})` : "");
      ajustarArma();
      flagDirty();
      fecharModalArmas();
    });
    armasLista.appendChild(row);
  });
  if (armasLista.children.length === 0) {
    const v = document.createElement("div");
    v.className = "armas-vazio";
    v.textContent = "Nenhuma arma encontrada.";
    armasLista.appendChild(v);
  }
}

function abrirModalArmas() {
  renderArmas("");
  armasBusca.value = "";
  modalArmas.hidden = false;
  setTimeout(() => armasBusca.focus(), 0);
}
function fecharModalArmas() {
  modalArmas.hidden = true;
}
document.getElementById("btn-escolher-arma").addEventListener("click", abrirModalArmas);
modalArmas.querySelector(".modal-close").addEventListener("click", fecharModalArmas);
modalArmas.addEventListener("click", (e) => { if (e.target === modalArmas) fecharModalArmas(); });
armasBusca.addEventListener("input", () => renderArmas(armasBusca.value));
document.addEventListener("keydown", (e) => {
  if (!modalArmas.hidden && e.key === "Escape") fecharModalArmas();
});

/* ===== Encontros (lista dinâmica + modal) ===== */
const encontros = [];
const encontrosBody = document.getElementById("encontros-body");

function renderEncontros() {
  encontrosBody.innerHTML = "";
  if (encontros.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.className = "encontros-vazio";
    td.textContent = "Nenhum encontro ainda. Clica em + adicionar pra começar.";
    tr.appendChild(td);
    encontrosBody.appendChild(tr);
    return;
  }
  encontros.forEach((enc) => {
    const tr = document.createElement("tr");
    tr.dataset.id = enc.id;

    // Coluna ícone (avatar circular)
    const tdIcone = document.createElement("td");
    const avatar = document.createElement("div");
    avatar.className = "encontro-avatar" + (enc.icone ? " tem-icone" : "");
    avatar.title = "Clique para escolher um ícone";
    if (enc.icone) {
      const img = document.createElement("img");
      img.src = enc.icone;
      img.alt = "";
      avatar.appendChild(img);
    } else {
      avatar.textContent = "🖼️";
    }
    avatar.addEventListener("click", () => abrirModalIcone(enc));
    tdIcone.appendChild(avatar);
    tr.appendChild(tdIcone);

    const tdNome = document.createElement("td");
    const inpNome = document.createElement("input");
    inpNome.type = "text";
    inpNome.className = "encontro-input";
    inpNome.value = enc.nome || "";
    inpNome.placeholder = "Quem / o quê";
    inpNome.addEventListener("input", () => { enc.nome = inpNome.value; flagDirty(); });
    tdNome.appendChild(inpNome);
    tr.appendChild(tdNome);

    const tdDesc = document.createElement("td");
    const inpDesc = document.createElement("input");
    inpDesc.type = "text";
    inpDesc.className = "encontro-input";
    inpDesc.value = enc.descricao || "";
    inpDesc.placeholder = "Descrição curta";
    inpDesc.addEventListener("input", () => { enc.descricao = inpDesc.value; flagDirty(); });
    tdDesc.appendChild(inpDesc);
    tr.appendChild(tdDesc);

    const tdAcao = document.createElement("td");
    const acoes = document.createElement("div");
    acoes.className = "encontro-actions";
    const btnNotas = document.createElement("button");
    btnNotas.type = "button";
    btnNotas.className = "btn-iconish notas" + (enc.anotacoes ? " tem-notas" : "");
    btnNotas.title = "Anotações";
    btnNotas.textContent = "✎";
    btnNotas.addEventListener("click", () => abrirModal(enc));
    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = "btn-iconish del";
    btnDel.title = "Remover";
    btnDel.textContent = "×";
    btnDel.addEventListener("click", () => {
      if (!confirm(`Remover o encontro "${enc.nome || "(sem nome)"}"?`)) return;
      const idx = encontros.findIndex((x) => x.id === enc.id);
      if (idx >= 0) encontros.splice(idx, 1);
      renderEncontros();
      flagDirty();
    });
    acoes.appendChild(btnNotas);
    acoes.appendChild(btnDel);
    tdAcao.appendChild(acoes);
    tr.appendChild(tdAcao);

    encontrosBody.appendChild(tr);
  });
}

document.getElementById("btn-add-encontro").addEventListener("click", () => {
  encontros.push({ id: novoId(), nome: "", descricao: "", anotacoes: "", icone: "" });
  renderEncontros();
  flagDirty();
});

/* ===== Modal de ícone do encontro (upload + drag-drop + resize) ===== */
const modalIcone = document.getElementById("modal-icone");
const modalIconeTitulo = document.getElementById("modal-icone-titulo");
const dropzone = document.getElementById("dropzone");
const dropzonePreview = document.getElementById("dropzone-preview");
const iconePick = document.getElementById("icone-pick");
const iconeFile = document.getElementById("icone-file");
const iconeRemover = document.getElementById("icone-remover");
let encIconeAtivo = null;

function abrirModalIcone(enc) {
  encIconeAtivo = enc;
  modalIconeTitulo.textContent = enc.nome || "(sem nome)";
  if (enc.icone) {
    dropzonePreview.innerHTML = `<img src="${enc.icone}" alt="" />`;
    dropzonePreview.hidden = false;
  } else {
    dropzonePreview.innerHTML = "";
    dropzonePreview.hidden = true;
  }
  modalIcone.hidden = false;
}
function fecharModalIcone() {
  modalIcone.hidden = true;
  encIconeAtivo = null;
}

modalIcone.querySelector(".modal-close").addEventListener("click", fecharModalIcone);
modalIcone.addEventListener("click", (e) => { if (e.target === modalIcone) fecharModalIcone(); });
document.addEventListener("keydown", (e) => {
  if (!modalIcone.hidden && e.key === "Escape") fecharModalIcone();
});

iconePick.addEventListener("click", () => iconeFile.click());
iconeFile.addEventListener("change", () => {
  const file = iconeFile.files?.[0];
  if (file) processarImagem(file);
  iconeFile.value = "";
});

["dragenter", "dragover"].forEach((ev) => {
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add("drag"); });
});
["dragleave", "drop"].forEach((ev) => {
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove("drag"); });
});
dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith("image/")) processarImagem(file);
});

iconeRemover.addEventListener("click", () => {
  if (!encIconeAtivo) return;
  encIconeAtivo.icone = "";
  renderEncontros();
  flagDirty();
  fecharModalIcone();
});

function processarImagem(file) {
  if (!encIconeAtivo) return;
  if (!file.type.startsWith("image/")) {
    alert("Por favor, selecione um arquivo de imagem.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const TAM = 128;
      canvas.width = TAM;
      canvas.height = TAM;
      const ctx = canvas.getContext("2d");
      // crop quadrado central + resize
      const lado = Math.min(img.width, img.height);
      const sx = (img.width - lado) / 2;
      const sy = (img.height - lado) / 2;
      ctx.drawImage(img, sx, sy, lado, lado, 0, 0, TAM, TAM);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      encIconeAtivo.icone = dataUrl;
      // Atualiza preview no modal
      dropzonePreview.innerHTML = `<img src="${dataUrl}" alt="" />`;
      dropzonePreview.hidden = false;
      renderEncontros();
      flagDirty();
    };
    img.onerror = () => alert("Não foi possível ler a imagem.");
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

const modalBack = document.getElementById("modal-encontro");
const modalTitulo = document.getElementById("modal-titulo");
const modalTextarea = document.getElementById("modal-anotacoes");
let encontroAtivo = null;

function abrirModal(enc) {
  encontroAtivo = enc;
  modalTitulo.textContent = enc.nome || "(sem nome)";
  modalTextarea.value = enc.anotacoes || "";
  modalBack.hidden = false;
  setTimeout(() => modalTextarea.focus(), 0);
}
function fecharModal() {
  if (encontroAtivo) {
    encontroAtivo.anotacoes = modalTextarea.value;
    renderEncontros();
    flagDirty();
  }
  encontroAtivo = null;
  modalBack.hidden = true;
}
modalBack.querySelector(".modal-close").addEventListener("click", fecharModal);
modalBack.addEventListener("click", (e) => { if (e.target === modalBack) fecharModal(); });
document.addEventListener("keydown", (e) => {
  if (!modalBack.hidden && e.key === "Escape") fecharModal();
});
modalTextarea.addEventListener("input", () => {
  if (encontroAtivo) {
    encontroAtivo.anotacoes = modalTextarea.value;
    flagDirty();
  }
});

/* ===== Export / Import / Reset ===== */

document.getElementById("btn-export").addEventListener("click", () => {
  const data = {
    versao: 3,
    quando: new Date().toISOString(),
    campos: lerCampos(),
  };
  const nome = (data.campos.nome || "ficha").trim().replace(/[^a-z0-9_-]/gi, "_") || "ficha";
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ficha-avalon-${nome}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const fileInput = document.getElementById("file-import");
document.getElementById("btn-import").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const f = fileInput.files?.[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.campos) aplicarCampos(data.campos);
      flagDirty();
      alert("Ficha importada.");
    } catch (e) {
      alert("Arquivo inválido.");
    }
    fileInput.value = "";
  };
  reader.readAsText(f);
});

document.getElementById("btn-reset").addEventListener("click", () => {
  if (!confirm("Apagar TUDO da ficha? Recomendo exportar antes.")) return;
  document.querySelectorAll("[data-field]").forEach((el) => {
    if (el.type === "checkbox") el.checked = false;
    else if (el.isContentEditable) el.innerHTML = "";
    else el.value = "";
  });
  encontros.length = 0;
  itens.length = 0;
  renderEncontros();
  renderItens();
  flagDirty();
});

/* ===== Sync periódico ===== */
async function syncPull() {
  if (temMudancaLocal || inflight) return;
  if (Date.now() - ultimaSaveOk < 1000) return;
  const ativoEhInput = document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
  if (ativoEhInput) return;
  try {
    const res = await fetch(API);
    if (!res.ok) return;
    if (temMudancaLocal || inflight) return;
    const data = await res.json();
    const localCampos = JSON.stringify(lerCampos());
    const remotoCampos = JSON.stringify(data.campos || {});
    if (localCampos !== remotoCampos) {
      if (data.campos) aplicarCampos(data.campos);
    }
  } catch (e) { /* offline */ }
}

/* ===== Navegação por abas (sidebar) ===== */
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const btnMenu = document.getElementById("btn-menu");
const brandAba = document.getElementById("brand-aba");
const navItems = document.querySelectorAll(".nav-item[data-tab]");

const ABAS_NOMES = {
  frente: "Ficha do personagem",
  verso1: "Energia & Anotações",
  verso2: "Habilidades",
  encontros: "Encontros",
  background: "Background",
  diario: "Diário de sessões",
};

function abrirSidebar(abrir = true) {
  sidebar.hidden = !abrir;
  sidebarOverlay.hidden = !abrir;
}

function mostrarAba(nome) {
  if (!nome || !ABAS_NOMES[nome]) nome = "frente";
  document.querySelectorAll(".page").forEach((p) => {
    p.hidden = (p.dataset.page !== nome);
  });
  navItems.forEach((it) => {
    it.classList.toggle("atual", it.dataset.tab === nome);
  });
  brandAba.textContent = ABAS_NOMES[nome];
  if (location.hash !== "#" + nome) {
    history.replaceState(null, "", "#" + nome);
  }
  if (window.innerWidth < 1100) abrirSidebar(false);
  document.querySelectorAll(".page-grid").forEach((g) => g.scrollTop = 0);
}

btnMenu.addEventListener("click", () => abrirSidebar(sidebar.hidden));
sidebarOverlay.addEventListener("click", () => abrirSidebar(false));
navItems.forEach((it) => {
  it.addEventListener("click", () => mostrarAba(it.dataset.tab));
});
window.addEventListener("hashchange", () => {
  const nome = location.hash.replace(/^#/, "");
  if (nome && ABAS_NOMES[nome]) mostrarAba(nome);
});

function ajustarSidebarFixa() {
  if (window.innerWidth >= 1100) {
    document.body.classList.add("sidebar-fixed");
    sidebar.hidden = false;
    sidebarOverlay.hidden = true;
  } else {
    document.body.classList.remove("sidebar-fixed");
    sidebar.hidden = true;
    sidebarOverlay.hidden = true;
  }
}
window.addEventListener("resize", ajustarSidebarFixa);
ajustarSidebarFixa();

/* ===== Toolbar de formatação (contenteditable) ===== */
const formatToolbar = document.getElementById("format-toolbar");
let editorAtual = null;

function eEditorAtivo(el) {
  return el && el.classList && el.classList.contains("lined-edit");
}

document.addEventListener("focusin", (e) => {
  if (eEditorAtivo(e.target)) {
    editorAtual = e.target;
    formatToolbar.hidden = false;
  }
});
document.addEventListener("focusout", () => {
  setTimeout(() => {
    const ativo = document.activeElement;
    if (!eEditorAtivo(ativo) && !(ativo && ativo.closest && ativo.closest(".format-toolbar"))) {
      formatToolbar.hidden = true;
      editorAtual = null;
    }
  }, 80);
});

function aplicarFormato(cmd) {
  if (!editorAtual) return;
  editorAtual.focus();
  if (cmd === "bold") document.execCommand("bold");
  else if (cmd === "italic") document.execCommand("italic");
  else if (cmd === "h2") document.execCommand("formatBlock", false, "<h2>");
  else if (cmd === "h3") document.execCommand("formatBlock", false, "<h3>");
  else if (cmd === "paragrafo") document.execCommand("formatBlock", false, "<div>");
  flagDirty();
}

formatToolbar.querySelectorAll(".fmt-btn").forEach((btn) => {
  btn.addEventListener("mousedown", (e) => e.preventDefault());
  btn.addEventListener("click", () => aplicarFormato(btn.dataset.cmd));
});

document.querySelectorAll(".lined-edit").forEach((el) => {
  el.addEventListener("input", flagDirty);
});


/* ===== Atalhos ===== */
document.addEventListener("keydown", (e) => {
  if (eEditorAtivo(e.target) || (editorAtual && document.activeElement === editorAtual)) {
    if ((e.ctrlKey || e.metaKey) && e.key === "1") { e.preventDefault(); aplicarFormato("h2"); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === "2") { e.preventDefault(); aplicarFormato("h3"); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) { e.preventDefault(); aplicarFormato("bold"); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key === "i" || e.key === "I")) { e.preventDefault(); aplicarFormato("italic"); return; }
  }
});

/* ===== Boot ===== */

// Fallback pra browsers sem :has() (Safari < 15.4): marca a page-grid se contém editor com rolagem
document.querySelectorAll(".page-grid").forEach((g) => {
  if (g.querySelector(".lined-scroll")) g.classList.add("has-lined-scroll");
});

(async () => {
  const ok = await carregarDoServidor();
  if (!ok) carregarDoCache();
  const abaInicial = location.hash.replace(/^#/, "") || "frente";
  mostrarAba(abaInicial);
  setInterval(syncPull, 8000);
})();

window.addEventListener("focus", syncPull);

/* ===== PWA service worker ===== */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
  let recarregando = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (recarregando) return;
    recarregando = true;
    window.location.reload();
  });
}
