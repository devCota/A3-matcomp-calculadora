import {
  bisection,
  newton,
  secant,
  integrate,
  type RootResult,
} from "../math/numerical";
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
  download,
} from "../utils";
import { sampleFunction, renderChart } from "./chart";
export function mountNumerical(
  root: HTMLElement,
  payload?: Record<string, unknown>,
): () => void {
  root.innerHTML =
    pageHeading(
      "Cálculo numérico",
      "A resposta é uma aproximação. O caminho também importa.",
    ) +
    `<div class="module-grid numerical-grid"><section class="panel input-panel"><div class="panel-heading"><h2>Escolha seu método</h2><span class="tag">Módulo diferencial</span></div><form id="numerical-form"><label class="field">Método<select name="method"><option value="bisection">Raízes · Bisseção</option><option value="newton">Raízes · Newton-Raphson</option><option value="secant">Raízes · Secante</option><option value="trapezoid">Integral · Trapézios compostos</option><option value="simpson">Integral · Simpson 1/3 composto</option></select></label>${field("Expressão f(x)", "expression", "x^2 - 2", "text", 'spellcheck="false" required maxlength="512"')}<div class="field-row" id="bounds-fields">${field("Limite a / aproximação x₀", "a", 0, "text", 'inputmode="decimal"')}${field("Limite b / aproximação x₁", "b", 2, "text", 'inputmode="decimal"')}</div><div id="initial-field" hidden>${field("Aproximação inicial x₀", "x0", 1, "text", 'inputmode="decimal"')}</div><div class="field-row" id="root-options">${field("Tolerância", "tolerance", "0.00000001", "text", 'inputmode="decimal"')}${field("Máx. de iterações", "maxIterations", 100, "number", 'min="1" max="500"')}</div><div id="subdivisions-field" hidden>${field("Subdivisões n", "subdivisions", 100, "number", 'min="2" max="10000"')}<p class="field-note">Simpson exige n par. Até 10000 subdivisões.</p></div><p id="method-help" class="method-help"></p><p class="field-note">Trigonometria em <strong>${storage.preferences.angle}</strong>. Tolerância: 10⁻¹² a 0,1.</p><button type="submit" class="primary"><i data-lucide="route"></i> Executar método</button><p class="error" id="numerical-error" role="alert" hidden></p></form><div class="examples"><h3>Exemplos para apresentar</h3><button data-method="bisection">Encontrar √2 <span>Bisseção de x² − 2 em [0; 2]</span></button><button data-method="newton">Convergência de Newton <span>x² − 2, começando em 1</span></button><button data-method="simpson">Área sob uma parábola <span>∫₀¹ x² dx, Simpson</span></button></div></section><section class="panel result-panel numerical-result"><div class="panel-heading"><h2>Resultado e processo</h2><button class="icon-button" id="copy-numerical" aria-label="Copiar resultado numérico"><i data-lucide="copy"></i></button></div><div id="numerical-output" aria-live="polite"><div class="empty-state"><span class="empty-symbol">≈</span><h3>O caminho até a solução</h3><p>Execute um método para acompanhar a aproximação, o critério de parada e cada iteração.</p></div></div><div id="numerical-chart" class="chart small-chart" role="img" aria-label="Gráfico da função do método numérico" hidden></div><div id="iteration-section" hidden><div class="iteration-heading"><h3>Iterações</h3><button class="text-button" id="export-iterations"><i data-lucide="download"></i> Exportar CSV</button></div><p class="field-note">Erro de passo ou semilargura do intervalo; não é o erro verdadeiro da raiz.</p><p class="table-scroll-hint field-note" id="table-scroll-hint"><i data-lucide="move-horizontal"></i> Role horizontalmente para ver as colunas. No teclado, foque a tabela e use as setas.</p><div class="table-scroll" role="region" tabindex="0" aria-label="Tabela de iterações com rolagem horizontal" aria-describedby="table-scroll-hint"><table><thead id="iterations-head"></thead><tbody id="iterations-body"></tbody></table></div></div></section></div>`;
  const form = root.querySelector<HTMLFormElement>("form")!,
    method = form.elements.namedItem("method") as HTMLSelectElement,
    error = root.querySelector<HTMLElement>("#numerical-error")!;
  const helps: Record<string, string> = {
    bisection:
      "Exige f(a) e f(b) com sinais opostos e continuidade no intervalo. O programa não comprova continuidade.",
    newton:
      "Derivada aproximada por diferença central adaptativa, com passo h = ∛ε · max(1, |x|). Pode falhar ou divergir.",
    secant:
      "Usa duas aproximações para estimar a inclinação, sem calcular derivadas. Pode não convergir.",
    trapezoid:
      "Aproxima a área por trapézios. A função deve ser real, finita e integrável em todo o intervalo.",
    simpson:
      "Aproxima a área por trechos parabólicos. Exige n par e função suficientemente regular.",
  };
  let dispose = () => {},
    active = true,
    generation = 0,
    raw = "",
    csv = "";
  const update = () => {
    const integral = ["trapezoid", "simpson"].includes(method.value);
    root.querySelector<HTMLElement>("#root-options")!.hidden = integral;
    root.querySelector<HTMLElement>("#subdivisions-field")!.hidden = !integral;
    root.querySelector<HTMLElement>("#bounds-fields")!.hidden =
      method.value === "newton";
    root.querySelector<HTMLElement>("#initial-field")!.hidden =
      method.value !== "newton";
    root.querySelector("#method-help")!.textContent = helps[method.value];
  };
  method.onchange = update;
  const run = async () => {
    error.hidden = true;
    const token = ++generation;
    root.querySelector<HTMLElement>("#iteration-section")!.hidden = true;
    const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
    submit.disabled = true;
    submit.textContent = "Calculando…";
    // Dá ao navegador uma oportunidade de pintar o estado de processamento.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    try {
      const expr = (form.elements.namedItem("expression") as HTMLInputElement)
          .value,
        m = method.value,
        integral = ["trapezoid", "simpson"].includes(m),
        angle = storage.preferences.angle;
      const a =
          m === "newton" ? numberValue(form, "x0") : numberValue(form, "a"),
        b = m === "newton" ? a + 2 : numberValue(form, "b");
      let graphMin = a,
        graphMax = b;
      let summary: string;
      if (integral) {
        const result = integrate(
          expr,
          a,
          b,
          numberValue(form, "subdivisions"),
          m as "trapezoid" | "simpson",
          angle,
        );
        raw = String(result.value);
        summary = `≈ ${displayNumber(result.value)}`;
        root.querySelector("#numerical-output")!.innerHTML =
          `<span class="status-chip">Aproximação da integral</span><div class="numerical-answer"><span>≈</span><output>${escapeHTML(displayNumber(result.value))}</output></div><p class="result-explanation">${m === "simpson" ? "Simpson 1/3 composto" : "Trapézios compostos"} · ${result.subdivisions} subdivisões · [${escapeHTML(displayNumber(a))}; ${escapeHTML(displayNumber(b))}]</p><div class="warning-note">O valor é aproximado. O erro não foi estimado e a amostragem não prova integrabilidade.</div>`;
      } else {
        const opts = {
          tolerance: numberValue(form, "tolerance"),
          maxIterations: numberValue(form, "maxIterations"),
          angle,
        };
        const r: RootResult =
          m === "bisection"
            ? bisection(expr, a, b, opts)
            : m === "newton"
              ? newton(expr, a, opts)
              : secant(expr, a, b, opts);
        raw = String(r.root);
        summary = `≈ ${displayNumber(r.root)} · ${r.converged ? "convergiu" : "não convergiu"}`;
        root.querySelector("#numerical-output")!.innerHTML =
          `<span class="status-chip ${r.converged ? "success" : "warning"}"><i data-lucide="${r.converged ? "circle-check" : "triangle-alert"}"></i>${r.converged ? "Convergência atingida" : "Sem convergência"}</span><div class="numerical-answer"><span>≈</span><output>${escapeHTML(displayNumber(r.root))}</output></div><div class="metrics-row"><div><span>Residual |f(x)|</span><strong>${escapeHTML(displayNumber(r.residual))}</strong></div><div><span>Iterações</span><strong>${r.iterations.at(-1)?.i ?? 0}</strong></div></div><p class="result-explanation">${escapeHTML(r.reason)}</p>`;
        const isBis = m === "bisection";
        root.querySelector("#iterations-head")!.innerHTML =
          `<tr><th>i</th>${isBis ? "<th>a</th><th>b</th>" : ""}<th>x</th><th>f(x)</th><th>${isBis ? "(b − a) / 2" : "|xᵢ − xᵢ₋₁|"}</th></tr>`;
        root.querySelector("#iterations-body")!.innerHTML = r.iterations
          .map(
            (row) =>
              `<tr><td>${row.i}</td>${isBis ? `<td>${escapeHTML(displayNumber(row.a!))}</td><td>${escapeHTML(displayNumber(row.b!))}</td>` : ""}<td>${escapeHTML(displayNumber(row.x))}</td><td>${escapeHTML(displayNumber(row.fx))}</td><td>${row.error === null ? "—" : escapeHTML(displayNumber(row.error))}</td></tr>`,
          )
          .join("");
        csv =
          "iteracao;x;fx;erro_de_passo_ou_semilargura;a;b\n" +
          r.iterations
            .map((row) =>
              [
                row.i,
                row.x,
                row.fx,
                row.error ?? "",
                row.a ?? "",
                row.b ?? "",
              ].join(";"),
            )
            .join("\n");
        root.querySelector<HTMLElement>("#iteration-section")!.hidden = false;
        const span = Math.max(0.5, Math.abs(a - r.root) * 1.3);
        graphMin = Math.min(a, r.root) - span;
        graphMax = Math.max(a, r.root) + span;
        if (m === "bisection") {
          graphMin = a;
          graphMax = b;
        }
      }
      const payload: Record<string, unknown> = { method: m };
      for (const name of [
        "expression",
        "a",
        "b",
        "x0",
        "tolerance",
        "maxIterations",
        "subdivisions",
      ])
        payload[name] = (
          form.elements.namedItem(name) as HTMLInputElement
        ).value;
      storage.add(
        "numerical",
        `${method.selectedOptions[0].text}: ${expr}`,
        summary,
        payload,
      );
      const container = root.querySelector<HTMLElement>("#numerical-chart")!;
      container.hidden = false;
      dispose();
      const points = sampleFunction(expr, graphMin, graphMax, angle, 400);
      const nextDispose = await renderChart(
        container,
        [{ name: `f(x) = ${expr}`, points }],
        { area: integral, min: graphMin, max: graphMax },
      );
      if (!active || token !== generation) nextDispose();
      else dispose = nextDispose;
      icons();
    } catch (e) {
      setError(error, e);
      raw = "";
      dispose();
      root.querySelector<HTMLElement>("#numerical-chart")!.hidden = true;
      root.querySelector("#numerical-output")!.innerHTML =
        '<p class="result-explanation">O cálculo não foi concluído. Revise os parâmetros indicados.</p>';
    } finally {
      if (active) {
        submit.disabled = false;
        submit.innerHTML = '<i data-lucide="route"></i> Executar método';
        icons();
      }
    }
  };
  form.onsubmit = (e) => {
    e.preventDefault();
    void run();
  };
  root.querySelectorAll<HTMLButtonElement>("[data-method]").forEach(
    (btn) =>
      (btn.onclick = () => {
        method.value = btn.dataset.method!;
        (form.elements.namedItem("expression") as HTMLInputElement).value =
          method.value === "simpson" ? "x^2" : "x^2 - 2";
        (form.elements.namedItem("a") as HTMLInputElement).value = "0";
        (form.elements.namedItem("b") as HTMLInputElement).value =
          method.value === "simpson" ? "1" : "2";
        (form.elements.namedItem("x0") as HTMLInputElement).value = "1";
        update();
        void run();
      }),
  );
  if (payload) {
    if (typeof payload.method === "string" && helps[payload.method])
      method.value = payload.method;
    for (const name of [
      "expression",
      "a",
      "b",
      "x0",
      "tolerance",
      "maxIterations",
      "subdivisions",
    ])
      if (payload[name] !== undefined)
        (form.elements.namedItem(name) as HTMLInputElement).value = String(
          payload[name],
        );
  }
  update();
  root.querySelector<HTMLButtonElement>("#copy-numerical")!.onclick = () => {
    if (raw) void copy(raw);
  };
  root.querySelector<HTMLButtonElement>("#export-iterations")!.onclick = () =>
    download(csv, "piratas-iteracoes.csv", "text/csv;charset=utf-8");
  icons();
  return () => {
    active = false;
    generation++;
    dispose();
  };
}
