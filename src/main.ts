import "@fontsource-variable/manrope";
import "./styles/main.css";
import {
  createIcons,
  MoveHorizontal,
  Delete,
  Calculator,
  ChartSpline,
  Grid2X2,
  Shuffle,
  Route,
  History,
  Settings2,
  BookOpen,
  ArrowUpRight,
  ArrowRight,
  Copy,
  Trash2,
  X,
  Download,
  RotateCcw,
  Lightbulb,
  Keyboard,
  ChevronDown,
  Equal,
  Info,
  MousePointer2,
  CircleCheck,
  TriangleAlert,
  Check,
  Sun,
  Moon,
  Menu,
  Compass,
} from "lucide";
import { storage, type ModuleId, type HistoryEntry } from "./services/storage";
import { escapeHTML, copy, download, toast, icons } from "./utils";
const iconSet = {
  MoveHorizontal,
  Delete,
  Calculator,
  ChartSpline,
  Grid2x2: Grid2X2,
  Shuffle,
  Route,
  History,
  Settings2,
  BookOpen,
  ArrowUpRight,
  ArrowRight,
  Copy,
  Trash2,
  X,
  Download,
  RotateCcw,
  Lightbulb,
  Keyboard,
  ChevronDown,
  Equal,
  Info,
  MousePointer2,
  CircleCheck,
  TriangleAlert,
  Check,
  Sun,
  Moon,
  Menu,
  Compass,
};
const modules: { id: ModuleId; label: string; icon: string; short: string }[] =
  [
    { id: "scientific", label: "Científica", icon: "calculator", short: "01" },
    { id: "functions", label: "Funções", icon: "chart-spline", short: "02" },
    { id: "matrices", label: "Matrizes", icon: "grid-2x2", short: "03" },
    {
      id: "combinatorics",
      label: "Combinatória",
      icon: "shuffle",
      short: "04",
    },
    { id: "numerical", label: "Cálculo numérico", icon: "route", short: "05" },
  ];
const label = (id: ModuleId) => modules.find((m) => m.id === id)!.label;
const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML = `<div class="app-shell"><aside class="sidebar"><a href="#scientific" class="brand" aria-label="Piratas do Cálculo, início"><span class="brand-symbol" aria-hidden="true">π<span></span></span><span>Piratas<br> do Cálculo<span class="brand-caption">Matemática, sem pressa.</span></span></a><nav aria-label="Módulos da calculadora">${modules.map((m) => `<a href="#${m.id}" data-module="${m.id}"><i data-lucide="${m.icon}"></i><span>${m.label}</span></a>`).join("")}</nav><p class="nav-scroll-hint"><i data-lucide="move-horizontal"></i> Deslize para ver os módulos</p><div class="sidebar-bottom"><button class="help-link" id="sidebar-help"><i data-lucide="book-open"></i> Guia da calculadora <i data-lucide="arrow-up-right"></i></button><div class="academic-credit"><span>Um projeto de</span><strong>Matemática Computacional</strong><span>Centro Universitário UNA</span></div></div></aside><div class="app-main"><header class="topbar"><div class="breadcrumb">Bancada de matemática <span>/</span> <strong id="current-module">Científica</strong></div><div class="topbar-actions"><button class="toolbar-button" id="open-history"><i data-lucide="history"></i><span>Histórico</span><span class="count" id="history-count">0</span></button><button class="icon-button" id="open-settings" aria-label="Preferências" title="Preferências"><i data-lucide="settings-2"></i></button><button class="icon-button" id="open-help" aria-label="Ajuda e atalhos" title="Ajuda e atalhos"><i data-lucide="book-open"></i></button></div></header><main id="workspace" tabindex="-1"></main><footer class="app-footer"><span>Piratas do Cálculo <span aria-hidden="true">·</span> Feito para explorar.</span><span>Sem conta. Sem servidor. Só matemática.</span></footer></div></div>
<dialog id="history-dialog" class="drawer" aria-labelledby="history-title"><div class="dialog-heading"><div><h2 id="history-title">Seu histórico</h2><p>Até 100 cálculos, guardados neste navegador.</p></div><button class="icon-button close-dialog" aria-label="Fechar histórico"><i data-lucide="x"></i></button></div><div id="history-list"></div><div class="dialog-footer"><button class="secondary" id="export-history"><i data-lucide="download"></i> Exportar TXT</button><button class="text-button danger" id="clear-history"><i data-lucide="trash-2"></i> Limpar histórico</button></div></dialog>
<dialog id="settings-dialog" aria-labelledby="settings-title"><div class="dialog-heading"><div><h2 id="settings-title">Preferências</h2><p>Do seu jeito, no seu navegador.</p></div><button class="icon-button close-dialog" aria-label="Fechar preferências"><i data-lucide="x"></i></button></div><form id="settings-form"><fieldset><legend>Unidade angular</legend><div class="radio-row"><label><input type="radio" name="angle" value="DEG"> Graus · DEG</label><label><input type="radio" name="angle" value="RAD"> Radianos · RAD</label></div></fieldset><label class="field">Algarismos / casas de exibição<select name="digits"><option value="6">6</option><option value="10">10</option><option value="12">12</option><option value="16">16</option></select></label><label class="field">Notação<select name="notation"><option value="auto">Automática · algarismos significativos</option><option value="fixed">Decimal fixa · casas decimais</option><option value="scientific">Científica · algarismos significativos</option></select></label><label class="field">Aparência<select name="theme"><option value="light">Clara</option><option value="dark">Escura</option></select></label><p class="field-note">A formatação arredonda a exibição. Copiar resultado preserva o valor calculado. BigInt combinatório sempre mostra todos os algarismos.</p><button class="primary" type="submit"><i data-lucide="check"></i> Salvar preferências</button></form></dialog>
<dialog id="help-dialog" class="help-dialog" aria-labelledby="help-title"><div class="dialog-heading"><div><h2 id="help-title">Um guia para explorar</h2><p>Matemática no centro. Os controles ao seu alcance.</p></div><button class="icon-button close-dialog" aria-label="Fechar ajuda"><i data-lucide="x"></i></button></div><div class="help-content"><h3>Teclado físico</h3><div class="shortcut-list">${[
  ["0–9, +, −, *, /", "Números e operações"],
  ["Enter ou =", "Calcular"],
  ["Backspace", "Apagar um caractere ou seleção"],
  ["Esc", "Limpar a expressão · C"],
  ["Delete", "Limpar número antes do cursor · CE"],
  [". ou ,", "Separador decimal"],
  ["( ), ^, %", "Parênteses, potência e porcentagem"],
  ["Ctrl+C / Ctrl+V", "Copiar e colar no campo de expressão"],
]
  .map(([key, action]) => `<div><kbd>${key}</kbd><span>${action}</span></div>`)
  .join(
    "",
  )}</div><p>Digite funções por extenso: <code>sin(30)</code>, <code>sqrt(81)</code>, <code>ln(e)</code>. Os atalhos da científica respeitam o foco de outros campos e os atalhos do navegador.</p><h3>C, CE e Ans</h3><p><strong>C</strong> apaga toda a expressão, preservando Ans e memória. <strong>CE</strong> apaga a seleção ou o número imediatamente antes do cursor. <strong>Ans</strong> é o último resultado calculado nesta sessão.</p><h3>Expressões e precisão</h3><p>Use ponto ou vírgula decimal. Separe argumentos por <strong>ponto e vírgula</strong>: <code>log(8;2)</code> e <code>nthRoot(27;3)</code>. <code>log(x)</code> é base 10; <code>ln(x)</code> é base e. Porcentagem significa dividir por 100: <code>200*10% = 20</code>.</p><p><code>mod(a;b)</code> usa módulo com divisor positivo: <code>mod(-7;3) = 2</code>. O motor científico trabalha com até 64 algarismos significativos. O sinal <strong>≈</strong> identifica aproximações e arredondamentos de exibição. Matrizes e métodos numéricos usam ponto flutuante de 64 bits.</p><h3>Memória</h3><p><strong>MS</strong> armazena a expressão calculada. <strong>MR</strong> insere a memória. <strong>M+</strong> soma e <strong>M−</strong> subtrai da memória. <strong>MC</strong> limpa. A memória dura esta sessão; o histórico permanece no navegador.</p><h3>Sobre o projeto</h3><p>Piratas do Cálculo · Centro Universitário UNA · Matemática Computacional · Prof. André Rodrigues. Identidade inspirada em Slowpoke. Equipe: Guilherme Alonso, Ludmilla Santos, Olavo Paiva, Gabriella Chagas, João Victor Cabral e Lucas Cota.</p></div></dialog>`;
let current: ModuleId = "scientific",
  cleanup = () => {},
  navigation = 0;
const workspace = document.querySelector<HTMLElement>("#workspace")!;
function refreshIcons() {
  createIcons({
    icons: iconSet,
    attrs: { "stroke-width": 1.8, "aria-hidden": "true" },
  });
}
window.addEventListener("rendericons", refreshIcons);
function entryHTML(entry: HistoryEntry, compact = false) {
  const time = new Date(entry.timestamp);
  return `<article class="history-entry"><div class="history-meta"><span>${label(entry.module)}</span><time datetime="${escapeHTML(entry.timestamp)}">${Number.isFinite(time.getTime()) ? time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}${!compact && Number.isFinite(time.getTime()) ? " · " + time.toLocaleDateString("pt-BR") : ""}</time></div><button class="history-reuse" data-reuse="${escapeHTML(entry.id)}" title="Reutilizar este cálculo"><span>${escapeHTML(entry.expression)}</span><strong>${escapeHTML(entry.result)}</strong></button><div class="history-actions"><button class="text-button" data-reuse="${escapeHTML(entry.id)}"><i data-lucide="rotate-ccw"></i> Reutilizar</button>${compact ? "" : `<button class="icon-button" data-copy="${escapeHTML(entry.id)}" aria-label="Copiar resultado do histórico"><i data-lucide="copy"></i></button><button class="icon-button" data-delete="${escapeHTML(entry.id)}" aria-label="Remover cálculo do histórico"><i data-lucide="trash-2"></i></button>`}</div></article>`;
}
function renderHistory() {
  document.querySelector("#history-count")!.textContent = String(
    storage.history.length,
  );
  const empty =
    '<div class="empty-state"><span class="empty-symbol"><i data-lucide="history"></i></span><h3>Uma página em branco</h3><p>Seus cálculos aparecem aqui.<br>Faça o primeiro e continue de onde parou.</p></div>';
  document.querySelector("#history-list")!.innerHTML = storage.history.length
    ? storage.history.map((h) => entryHTML(h)).join("")
    : empty;
  const inline = document.querySelector("#inline-history");
  if (inline)
    inline.innerHTML = `<section class="panel recent-panel"><div class="panel-heading"><h2>Últimos cálculos</h2><i data-lucide="history"></i></div>${
      storage.history.length
        ? storage.history
            .slice(0, 3)
            .map((h) => entryHTML(h, true))
            .join("")
        : empty
    }<button class="history-all text-button" id="all-history">Ver histórico completo <i data-lucide="arrow-right"></i></button></section>`;
  document.querySelectorAll<HTMLButtonElement>("[data-reuse]").forEach(
    (b) =>
      (b.onclick = () => {
        const entry = storage.history.find((h) => h.id === b.dataset.reuse);
        if (entry) {
          (
            document.querySelector("#history-dialog") as HTMLDialogElement
          ).close();
          void navigate(entry.module, entry.payload);
        }
      }),
  );
  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach(
    (b) =>
      (b.onclick = () => {
        const h = storage.history.find((e) => e.id === b.dataset.copy);
        if (h) void copy(h.result);
      }),
  );
  document
    .querySelectorAll<HTMLButtonElement>("[data-delete]")
    .forEach((b) => (b.onclick = () => storage.remove(b.dataset.delete!)));
  const all = document.querySelector<HTMLButtonElement>("#all-history");
  if (all) all.onclick = () => openDialog("history");
  refreshIcons();
}

function revealActiveModule() {
  const nav = document.querySelector<HTMLElement>(".sidebar nav")!,
    active = nav.querySelector<HTMLElement>("[aria-current]");
  if (!active || nav.scrollWidth <= nav.clientWidth) return;
  const current = active.getBoundingClientRect(),
    bounds = nav.getBoundingClientRect();
  nav.scrollTo({
    left:
      nav.scrollLeft +
      current.left -
      bounds.left -
      (nav.clientWidth - current.width) / 2,
    behavior: "instant",
  });
}
window.addEventListener("resize", revealActiveModule);

async function navigate(id: ModuleId, payload?: Record<string, unknown>) {
  const token = ++navigation;
  cleanup();
  cleanup = () => {};
  current = id;
  document.title = `Piratas do Cálculo · ${label(id)}`;
  document.querySelector("#current-module")!.textContent = label(id);
  document.querySelectorAll("[data-module]").forEach((a) => {
    if ((a as HTMLElement).dataset.module === id)
      a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  revealActiveModule();
  if (location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
  workspace.innerHTML =
    '<div class="loading-state" role="status">Preparando sua bancada…</div>';
  try {
    const mount =
      id === "scientific"
        ? (await import("./modules/scientific")).mountScientific
        : id === "functions"
          ? (await import("./modules/functions")).mountFunctions
          : id === "matrices"
            ? (await import("./modules/matrices")).mountMatrices
            : id === "combinatorics"
              ? (await import("./modules/combinatorics")).mountCombinatorics
              : (await import("./modules/numerical")).mountNumerical;
    if (token !== navigation) return;
    cleanup = mount(workspace, payload);
    renderHistory();
    refreshIcons();
  } catch {
    workspace.innerHTML =
      '<div class="panel empty-state"><h1>Não foi possível abrir o módulo</h1><p>Recarregue a página e tente novamente.</p></div>';
  }
}
function openDialog(name: "history" | "help" | "settings") {
  const dialog = document.querySelector<HTMLDialogElement>(`#${name}-dialog`)!;
  if (name === "history") renderHistory();
  if (name === "settings") {
    const form = document.querySelector<HTMLFormElement>("#settings-form")!;
    for (const key of ["digits", "notation", "theme"] as const)
      (form.elements.namedItem(key) as HTMLSelectElement).value = String(
        storage.preferences[key],
      );
    (
      form.querySelector(
        `input[value="${storage.preferences.angle}"]`,
      ) as HTMLInputElement
    ).checked = true;
  }
  dialog.showModal();
}
document.querySelectorAll<HTMLAnchorElement>("[data-module]").forEach(
  (a) =>
    (a.onclick = (e) => {
      e.preventDefault();
      void navigate(a.dataset.module as ModuleId);
    }),
);
window.addEventListener("hashchange", () => {
  const id = location.hash.slice(1);
  if (modules.some((m) => m.id === id)) void navigate(id as ModuleId);
});
window.addEventListener(
  "navigatemodule",
  ((e: CustomEvent) =>
    void navigate(e.detail.id, e.detail.payload)) as EventListener,
);
window.addEventListener("storagechange", renderHistory);
window.addEventListener("openhelp", () => openDialog("help"));
document.querySelector<HTMLButtonElement>("#open-history")!.onclick = () =>
  openDialog("history");
document.querySelector<HTMLButtonElement>("#open-settings")!.onclick = () =>
  openDialog("settings");
document.querySelector<HTMLButtonElement>("#open-help")!.onclick = () =>
  openDialog("help");
document.querySelector<HTMLButtonElement>("#sidebar-help")!.onclick = () =>
  openDialog("help");
document
  .querySelectorAll<HTMLButtonElement>(".close-dialog")
  .forEach((b) => (b.onclick = () => b.closest("dialog")!.close()));
document.querySelectorAll<HTMLDialogElement>("dialog").forEach((d) =>
  d.addEventListener("click", (e) => {
    if (e.target === d) {
      const r = d.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        d.close();
    }
  }),
);
document.querySelector<HTMLFormElement>("#settings-form")!.onsubmit = (e) => {
  e.preventDefault();
  const data = new FormData(e.target as HTMLFormElement);
  storage.setPreferences({
    angle: data.get("angle") as "DEG" | "RAD",
    digits: Number(data.get("digits")),
    notation: data.get("notation") as "auto" | "fixed" | "scientific",
    theme: data.get("theme") as "light" | "dark",
  });
  document.documentElement.dataset.theme = storage.preferences.theme;
  (document.querySelector("#settings-dialog") as HTMLDialogElement).close();
  void navigate(current);
  toast("Preferências salvas.");
};
document.querySelector<HTMLButtonElement>("#clear-history")!.onclick = () => {
  if (!storage.history.length) return;
  if (confirm("Limpar todos os cálculos do histórico deste navegador?")) {
    storage.clear();
    toast("Histórico limpo.");
  }
};
document.querySelector<HTMLButtonElement>("#export-history")!.onclick = () => {
  if (!storage.history.length) {
    toast("Faça um cálculo antes de exportar.");
    return;
  }
  download(
    "Piratas do Cálculo — Histórico\n\n" +
      storage.history
        .map(
          (h) =>
            `${new Date(h.timestamp).toLocaleString("pt-BR")} | ${label(h.module)}\n${h.expression}\n= ${h.result}`,
        )
        .join("\n\n"),
    "piratas-historico.txt",
  );
};
document.documentElement.dataset.theme = storage.preferences.theme;
const initial = location.hash.slice(1) as ModuleId;
void navigate(modules.some((m) => m.id === initial) ? initial : "scientific");
refreshIcons();
