import * as matrix from "../math/matrices";
import type { Matrix } from "../math/matrices";
import { storage } from "../services/storage";
import {
  copy,
  displayNumber,
  escapeHTML,
  field,
  icons,
  numberValue,
  pageHeading,
  setError,
} from "../utils";
const initialA = [
    [2, -1],
    [3, 4],
  ],
  initialB = [
    [1, 2],
    [0, 1],
  ];
function dimensions(name: string, n: number, m: number) {
  return `<div class="matrix-dimensions"><label>Linhas<select name="${name}-rows" aria-label="Linhas da matriz ${name}">${Array.from({ length: 8 }, (_, i) => `<option ${i + 1 === n ? "selected" : ""}>${i + 1}</option>`).join("")}</select></label><span>×</span><label>Colunas<select name="${name}-cols" aria-label="Colunas da matriz ${name}">${Array.from({ length: 8 }, (_, i) => `<option ${i + 1 === m ? "selected" : ""}>${i + 1}</option>`).join("")}</select></label></div>`;
}
function grid(name: string, a: Matrix) {
  return `<div class="matrix-scroll" tabindex="0" role="region" aria-label="Grade da matriz ${name}; use setas para rolar se necessário"><div class="matrix-grid" style="grid-template-columns:repeat(${a[0].length},minmax(56px,1fr));min-width:${a[0].length * 56 + (a[0].length - 1) * 8 + 28}px">${a.flatMap((row, i) => row.map((v, j) => `<input name="${name}-${i}-${j}" aria-label="${name}, linha ${i + 1}, coluna ${j + 1}" value="${v}" inputmode="decimal" autocomplete="off">`)).join("")}</div></div>`;
}
export function matrixHTML(a: Matrix) {
  return `<div class="matrix-output-scroll"><div class="matrix-output" style="grid-template-columns:repeat(${a[0].length},minmax(64px,auto))">${a
    .flat()
    .map((v) => `<span>${escapeHTML(displayNumber(v))}</span>`)
    .join("")}</div></div>`;
}
export function mountMatrices(
  root: HTMLElement,
  payload?: Record<string, unknown>,
): () => void {
  let a = Array.isArray(payload?.a) ? (payload!.a as Matrix) : initialA,
    b = Array.isArray(payload?.b) ? (payload!.b as Matrix) : initialB;
  try {
    matrix.validateMatrix(a);
    matrix.validateMatrix(b);
  } catch {
    a = initialA;
    b = initialB;
  }
  root.innerHTML =
    pageHeading(
      "Matrizes",
      "Organize os valores. Encontre novas combinações.",
    ) +
    `<div class="panel matrix-workspace"><form id="matrix-form"><div class="matrix-pair">${(["A", "B"] as const).map((name) => `<section class="matrix-input" aria-label="Matriz ${name}"><div class="panel-heading"><h2>Matriz <span class="matrix-letter">${name}</span></h2><button type="button" class="text-button" data-clear="${name}">Zerar</button></div><div data-dimensions="${name}">${dimensions(name, (name === "A" ? a : b).length, (name === "A" ? a : b)[0].length)}</div><div data-grid="${name}">${grid(name, name === "A" ? a : b)}</div></section>`).join("")}</div><div class="operation-bar"><label class="field">Operação<select name="operation" aria-label="Operação matricial"><option value="add">Soma · A + B</option><option value="subtract">Subtração · A − B</option><option value="scale">Multiplicação por escalar · k × A</option><option value="multiply">Produto · A × B</option><option value="det">Determinante · det(A)</option><option value="transpose">Transposta · Aᵀ</option><option value="inverse">Inversa · A⁻¹</option><option value="trace">Traço · tr(A)</option><option value="power">Potência · Aⁿ</option></select></label><div id="scalar-field" hidden>${field("Escalar k", "scalar", 2, "text", 'inputmode="decimal"')}</div><div id="power-field" hidden>${field("Expoente n", "power", 2, "number", 'min="0" max="20"')}</div><button class="primary" type="submit"><i data-lucide="equal"></i> Calcular</button></div><p id="matrix-error" class="error" role="alert" hidden></p></form><div class="matrix-actions"><button class="text-button" id="matrix-example"><i data-lucide="rotate-ccw"></i> Carregar exemplo</button><button class="text-button" id="matrix-identity"><i data-lucide="grid-2x2"></i> Identidade em A</button><p>Até 8 × 8. Para operações com uma matriz, use A.</p></div></div><section class="panel matrix-result result-panel" aria-live="polite"><div class="panel-heading"><h2>Resultado</h2><button class="icon-button" id="copy-matrix" aria-label="Copiar resultado da matriz"><i data-lucide="copy"></i></button></div><div id="matrix-output"><div class="empty-state compact"><span class="empty-symbol">[ ]</span><p>Escolha uma operação e calcule.<br>O resultado aparece aqui.</p></div></div><p class="field-note" id="matrix-explanation">As dimensões são verificadas antes de cada operação.</p></section>`;
  const form = root.querySelector<HTMLFormElement>("form")!,
    error = root.querySelector<HTMLElement>("#matrix-error")!,
    operation = form.elements.namedItem("operation") as HTMLSelectElement;
  if (
    typeof payload?.operation === "string" &&
    Array.from(operation.options).some((o) => o.value === payload.operation)
  )
    operation.value = payload.operation;
  const read = (name: string): Matrix => {
    const rows = Number(
        (form.elements.namedItem(`${name}-rows`) as HTMLSelectElement).value,
      ),
      cols = Number(
        (form.elements.namedItem(`${name}-cols`) as HTMLSelectElement).value,
      );
    return Array.from({ length: rows }, (_, i) =>
      Array.from({ length: cols }, (_, j) =>
        numberValue(form, `${name}-${i}-${j}`),
      ),
    );
  };
  const resize = (name: string) => {
    const n = Number(
        (form.elements.namedItem(`${name}-rows`) as HTMLSelectElement).value,
      ),
      m = Number(
        (form.elements.namedItem(`${name}-cols`) as HTMLSelectElement).value,
      );
    const current = name === "A" ? a : b;
    const next = Array.from({ length: n }, (_, i) =>
      Array.from({ length: m }, (_, j) => {
        const input = form.elements.namedItem(
          `${name}-${i}-${j}`,
        ) as HTMLInputElement | null;
        return input && input.value.trim()
          ? Number(input.value.replace(",", "."))
          : (current[i]?.[j] ?? 0);
      }),
    );
    if (name === "A") a = next;
    else b = next;
    root.querySelector(`[data-grid="${name}"]`)!.innerHTML = grid(name, next);
  };
  root
    .querySelectorAll<HTMLSelectElement>("[data-dimensions] select")
    .forEach((s) => (s.onchange = () => resize(s.name[0])));
  const update = () => {
    root.querySelector<HTMLElement>("#scalar-field")!.hidden =
      operation.value !== "scale";
    root.querySelector<HTMLElement>("#power-field")!.hidden =
      operation.value !== "power";
  };
  operation.onchange = update;
  update();
  root.querySelectorAll<HTMLButtonElement>("[data-clear]").forEach(
    (btn) =>
      (btn.onclick = () => {
        root
          .querySelectorAll<HTMLInputElement>(
            `[data-grid="${btn.dataset.clear}"] input`,
          )
          .forEach((i) => (i.value = "0"));
      }),
  );
  let raw = "";
  form.onsubmit = (e) => {
    e.preventDefault();
    error.hidden = true;
    try {
      a = read("A");
      const op = operation.value;
      let value: Matrix | number,
        label = "",
        explanation = "";
      if (["add", "subtract", "multiply"].includes(op)) b = read("B");
      switch (op) {
        case "add":
          value = matrix.addMatrix(a, b);
          label = "A + B";
          explanation =
            "Elementos correspondentes são somados. As dimensões precisam ser iguais.";
          break;
        case "subtract":
          value = matrix.subtractMatrix(a, b);
          label = "A − B";
          explanation =
            "Elementos correspondentes de B são subtraídos dos de A.";
          break;
        case "scale": {
          const k = numberValue(form, "scalar");
          value = matrix.scaleMatrix(a, k);
          label = `${k} × A`;
          explanation = "Cada elemento de A é multiplicado pelo escalar.";
          break;
        }
        case "multiply":
          value = matrix.multiplyMatrix(a, b);
          label = "A × B";
          explanation =
            "Cada elemento do resultado é o produto escalar de uma linha de A com uma coluna de B.";
          break;
        case "det":
          value = matrix.determinant(a);
          label = "det(A)";
          explanation =
            "Calculado por eliminação de Gauss com pivotamento parcial.";
          break;
        case "transpose":
          value = matrix.transpose(a);
          label = "Aᵀ";
          explanation = "As linhas de A se tornam colunas.";
          break;
        case "inverse":
          value = matrix.inverse(a);
          label = "A⁻¹";
          explanation =
            "Calculada por Gauss-Jordan com pivotamento. Matrizes quase singulares são rejeitadas.";
          break;
        case "trace":
          value = matrix.trace(a);
          label = "tr(A)";
          explanation = "Soma dos elementos da diagonal principal.";
          break;
        default:
          value = matrix.powerMatrix(a, numberValue(form, "power"));
          label = "Aⁿ";
          explanation =
            "Potência calculada por multiplicações matriciais; A⁰ é a identidade.";
      }
      raw =
        typeof value === "number"
          ? String(value)
          : value.map((r) => r.join("\t")).join("\n");
      root.querySelector("#matrix-output")!.innerHTML =
        `<p class="result-operation">${escapeHTML(label)} <span class="answer-equals">=</span></p>${typeof value === "number" ? `<output class="scalar-result">${escapeHTML(displayNumber(value))}</output>` : matrixHTML(value)}<p class="field-note">${typeof value === "number" ? "Escalar" : `${value.length} linhas × ${value[0].length} colunas`} · aritmética de ponto flutuante, até 16 algarismos de exibição.</p>`;
      root.querySelector("#matrix-explanation")!.textContent = explanation;
      storage.add(
        "matrices",
        label,
        typeof value === "number"
          ? displayNumber(value)
          : JSON.stringify(value),
        {
          a,
          b,
          operation: op,
          scalar: (form.elements.namedItem("scalar") as HTMLInputElement).value,
          power: (form.elements.namedItem("power") as HTMLInputElement).value,
        },
      );
    } catch (err) {
      setError(error, err);
      raw = "";
      root.querySelector("#matrix-output")!.textContent =
        "A operação não foi concluída. Corrija os valores acima.";
    }
  };
  root.querySelector<HTMLButtonElement>("#matrix-example")!.onclick = () => {
    window.dispatchEvent(
      new CustomEvent("navigatemodule", { detail: { id: "matrices" } }),
    );
  };
  root.querySelector<HTMLButtonElement>("#matrix-identity")!.onclick = () => {
    const n = Number(
      (form.elements.namedItem("A-rows") as HTMLSelectElement).value,
    );
    a = matrix.identity(n);
    (form.elements.namedItem("A-cols") as HTMLSelectElement).value = String(n);
    root.querySelector('[data-grid="A"]')!.innerHTML = grid("A", a);
  };
  for (const name of ["scalar", "power"])
    if (typeof payload?.[name] === "string")
      (form.elements.namedItem(name) as HTMLInputElement).value = String(
        payload[name],
      );
  root.querySelector<HTMLButtonElement>("#copy-matrix")!.onclick = () => {
    if (raw) void copy(raw);
  };
  icons();
  return () => {};
}
