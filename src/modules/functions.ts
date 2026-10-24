import { evaluateFunction } from "../math/expression-engine";
import { storage } from "../services/storage";
import {
  displayEvaluation,
  displayNumber,
  escapeHTML,
  field,
  icons,
  numberValue,
  pageHeading,
  setError,
  copy,
} from "../utils";
import { sampleFunction, renderChart } from "./chart";
export function mountFunctions(
  root: HTMLElement,
  payload?: Record<string, unknown>,
): () => void {
  const expression = String(payload?.expression ?? "x^2 + 2x + 1");
  root.innerHTML =
    pageHeading(
      "Funções",
      "Dê uma expressão a x. Veja a matemática ganhar forma.",
    ) +
    `<div class="module-grid"><section class="panel input-panel"><div class="panel-heading"><h2>Defina sua função</h2><span class="formula-mark">f(x)</span></div><form id="functions-form"><label class="field formula-input">Expressão f(x)<input name="expression" value="${escapeHTML(expression)}" spellcheck="false" required maxlength="512"></label>${field("Avaliar em x =", "x", String(payload?.x ?? 3), "text", 'inputmode="decimal"')}<details class="compare"><summary>Comparar com outra função</summary>${field("Segunda função g(x)", "compare", "", "text", 'placeholder="Ex.: 2x + 1" spellcheck="false"')}</details><div class="field-row">${field("x mínimo", "min", -5, "text", 'inputmode="decimal"')}${field("x máximo", "max", 5, "text", 'inputmode="decimal"')}</div><p class="field-note">Trigonometria em <strong>${storage.preferences.angle}</strong>. Altere a unidade em Preferências.</p><button class="primary" type="submit"><i data-lucide="chart-spline"></i> Avaliar e traçar</button><p class="error" id="functions-error" role="alert" hidden></p></form><div class="examples"><h3>Experimente</h3><button data-expression="x^2 + 2x + 1" data-x="3">Parábola <span>x² + 2x + 1</span></button><button data-expression="sin(x)" data-x="30">Onda senoidal <span>sen(x)</span></button><button data-expression="1/x" data-x="2">Uma descontinuidade <span>1/x</span></button></div></section><section class="panel result-panel"><div class="panel-heading"><h2>Gráfico e resultado</h2><span class="tag">Interativo</span></div><div class="function-result" aria-live="polite"><span id="function-value-label">f(3)</span><strong id="function-result">—</strong><button class="icon-button" id="copy-function" aria-label="Copiar resultado"><i data-lucide="copy"></i></button></div><div id="function-chart" class="chart" role="img" aria-label="Gráfico cartesiano interativo da função"></div><div class="chart-caption"><i data-lucide="mouse-pointer-2"></i> Role para ampliar. Arraste para explorar.</div><div class="domain-note"><i data-lucide="info"></i><p>Valores fora do domínio real são omitidos. A amostragem detecta muitas descontinuidades, mas não prova continuidade nem determina todo o domínio.</p></div><p id="function-points" class="field-note"></p></section></div>`;
  const form = root.querySelector<HTMLFormElement>("form")!,
    error = root.querySelector<HTMLElement>("#functions-error")!;
  let dispose = () => {},
    generation = 0,
    active = true,
    raw = "";
  const run = async (record: boolean) => {
    const token = ++generation;
    error.hidden = true;
    try {
      const expr = (form.elements.namedItem("expression") as HTMLInputElement)
          .value,
        x = numberValue(form, "x"),
        min = numberValue(form, "min"),
        max = numberValue(form, "max");
      if (min >= max || max - min > 1e6)
        throw new Error(
          "O intervalo deve ser crescente e ter amplitude de até 1 milhão.",
        );
      const result = evaluateFunction(expr, x, storage.preferences.angle),
        shown = displayEvaluation(result);
      raw = result.raw;
      const compare = (
        form.elements.namedItem("compare") as HTMLInputElement
      ).value.trim();
      const series = [
        {
          name: `f(x) = ${expr}`,
          points: sampleFunction(expr, min, max, storage.preferences.angle),
        },
      ];
      if (compare)
        series.push({
          name: `g(x) = ${compare}`,
          points: sampleFunction(compare, min, max, storage.preferences.angle),
        });
      root.querySelector("#function-result")!.textContent =
        (shown.approximate ? "≈ " : "") + shown.text;
      root.querySelector("#function-value-label")!.textContent =
        `f(${displayNumber(x)})`;
      root.querySelector("#function-points")!.textContent =
        `701 amostras por função no intervalo [${displayNumber(min)}; ${displayNumber(max)}]. Resultado avaliado separadamente em x = ${displayNumber(x)}.`;
      dispose();
      const chartDispose = await renderChart(
        root.querySelector("#function-chart")!,
        series,
        { min, max },
      );
      if (!active || token !== generation) {
        chartDispose();
        return;
      }
      dispose = chartDispose;
      if (record)
        storage.add(
          "functions",
          `f(x) = ${expr}; x = ${x}`,
          `${shown.approximate ? "≈ " : ""}${shown.text}`,
          { expression: expr, x },
        );
    } catch (e) {
      setError(error, e);
      root.querySelector("#function-result")!.textContent = "—";
      raw = "";
      dispose();
      root.querySelector("#function-chart")!.replaceChildren();
    }
  };
  form.onsubmit = (e) => {
    e.preventDefault();
    void run(true);
  };
  root.querySelectorAll<HTMLButtonElement>("[data-expression]").forEach(
    (b) =>
      (b.onclick = () => {
        (form.elements.namedItem("expression") as HTMLInputElement).value =
          b.dataset.expression!;
        (form.elements.namedItem("x") as HTMLInputElement).value = b.dataset.x!;
        if (
          b.dataset.expression === "sin(x)" &&
          storage.preferences.angle === "DEG"
        ) {
          (form.elements.namedItem("min") as HTMLInputElement).value = "-360";
          (form.elements.namedItem("max") as HTMLInputElement).value = "360";
        }
        void run(false);
      }),
  );
  root.querySelector<HTMLButtonElement>("#copy-function")!.onclick = () => {
    if (raw) void copy(raw);
  };
  icons();
  void run(false);
  return () => {
    active = false;
    generation++;
    dispose();
  };
}
