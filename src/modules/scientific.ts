import { evaluate, decimal, type Evaluation } from "../math/expression-engine";
import { storage } from "../services/storage";
import {
  copy,
  displayEvaluation,
  displayNumber,
  escapeHTML,
  icons,
  pageHeading,
  setError,
  toast,
} from "../utils";
let expression = "",
  lastResult = "0",
  memory: string | null = null;
let displayed: Evaluation | null = {
  value: decimal.bignumber(0),
  raw: "0",
  approximate: false,
};
export function clearEntry(
  text: string,
  start = text.length,
  end = start,
): { text: string; cursor: number } {
  if (start !== end)
    return { text: text.slice(0, start) + text.slice(end), cursor: start };
  const before = text.slice(0, start),
    match = before.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i);
  const from = match ? start - match[0].length : start;
  return { text: text.slice(0, from) + text.slice(end), cursor: from };
}
const button = (label: string, action: string, extra = "", title = label) =>
  `<button type="button" class="key ${extra}" data-key="${escapeHTML(action)}" aria-label="${escapeHTML(title)}" title="${escapeHTML(title)}">${label}</button>`;
export function mountScientific(
  root: HTMLElement,
  payload?: Record<string, unknown>,
): () => void {
  if (typeof payload?.expression === "string") expression = payload.expression;
  root.innerHTML =
    pageHeading("Científica", "Seu próximo resultado começa aqui.") +
    `<div class="work-grid"><section class="calculator panel" aria-label="Calculadora científica">
    <div class="calc-toolbar"><span class="tool-label"><i data-lucide="calculator"></i> Calculadora científica</span><div class="segmented" aria-label="Unidade angular"><button data-angle="DEG" aria-pressed="${storage.preferences.angle === "DEG"}">DEG</button><button data-angle="RAD" aria-pressed="${storage.preferences.angle === "RAD"}">RAD</button></div></div>
    <div class="display"><div class="display-top"><label for="expression">Expressão</label><span id="memory-indicator"></span></div><textarea id="expression" aria-label="Expressão científica" rows="1" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="Digite uma expressão…">${escapeHTML(expression)}</textarea><div class="answer-line"><span class="answer-equals" aria-hidden="true">=</span><output id="answer" aria-live="polite">${escapeHTML(displayNumber(lastResult))}</output><button class="icon-button" id="copy-result" aria-label="Copiar resultado" title="Copiar resultado"><i data-lucide="copy"></i></button></div><p class="precision-note" id="precision-note">Precisão de cálculo: até 64 algarismos significativos.</p><p class="error" id="calc-error" role="alert" hidden></p></div>
    <div class="memory-row" aria-label="Memória">${["MC", "MR", "M+", "M−", "MS"].map((m) => button(m, m, "memory-key", ({ MC: "Limpar memória", MR: "Recuperar memória", "M+": "Somar à memória", "M−": "Subtrair da memória", MS: "Armazenar resultado" } as Record<string, string>)[m])).join("")}</div>
    <div class="science-grid">${[
      ["sin", "sin("],
      ["cos", "cos("],
      ["tan", "tan("],
      ["log", "log("],
      ["ln", "ln("],
      ["√", "sqrt("],
      ["x²", "square"],
      ["xʸ", "^"],
      ["n!", "!"],
      ["π", "pi"],
      ["e", "e"],
      ["1/x", "reciprocal"],
    ]
      .map(([l, a]) => button(l, a, "function-key"))
      .join("")}</div>
    <details class="advanced"><summary>Mais funções <i data-lucide="chevron-down"></i></summary><div class="science-grid">${[
      ["arcsen", "asin("],
      ["arccos", "acos("],
      ["arctan", "atan("],
      ["senh", "sinh("],
      ["cosh", "cosh("],
      ["tanh", "tanh("],
      ["ⁿ√x", "nthRoot("],
      ["logₐ", "log("],
      ["eˣ", "exp("],
      ["10ˣ", "10^("],
      ["|x|", "abs("],
      ["mod", "mod("],
      ["arred.", "round("],
      ["piso", "floor("],
      ["teto", "ceil("],
      [";", ";"],
    ]
      .map(([l, a]) => button(l, a, "function-key"))
      .join(
        "",
      )}</div><p>Base ou índice: <code>log(8; 2)</code> e <code>nthRoot(27; 3)</code>. Decimal: ponto. Módulo: <code>mod(−7; 3) = 2</code>.</p></details>
    <div class="number-grid">${[
      ["C", "clear", "control"],
      ["CE", "entry", "control"],
      ['<i data-lucide="delete"></i>', "backspace", "control"],
      ["±", "sign", "control"],
      ["÷", "/", "operator"],
      ["7", "7", ""],
      ["8", "8", ""],
      ["9", "9", ""],
      ["(", "(", "operator"],
      ["×", "*", "operator"],
      ["4", "4", ""],
      ["5", "5", ""],
      ["6", "6", ""],
      [")", ")", "operator"],
      ["−", "-", "operator"],
      ["1", "1", ""],
      ["2", "2", ""],
      ["3", "3", ""],
      ["%", "%", "operator"],
      ["+", "+", "operator"],
      ["Ans", "Ans", "control"],
      ["0", "0", ""],
      [",", ".", ""],
      ["xʸ", "^", "operator"],
      ["=", "calculate", "equals"],
    ]
      .map(([l, a, c]) =>
        button(
          l,
          a,
          c,
          (
            {
              clear: "Limpar expressão (Escape)",
              entry: "Limpar entrada atual (Delete)",
              backspace: "Apagar (Backspace)",
              sign: "Inverter sinal",
              calculate: "Calcular (Enter)",
            } as Record<string, string>
          )[a] || l,
        ),
      )
      .join("")}</div>
    <div class="calculator-foot"><span><i data-lucide="keyboard"></i> Seu teclado também calcula</span><button class="text-button" id="keyboard-help">Ver atalhos <i data-lucide="arrow-up-right"></i></button></div>
  </section><aside class="context-column"><div id="inline-history"></div><div class="tip-panel"><span class="tip-icon"><i data-lucide="lightbulb"></i></span><h2>Sem pressa. Com precisão.</h2><p>Parênteses primeiro. Depois potências, multiplicação e divisão, soma e subtração.</p><button class="example-link" id="science-example">Experimentar: (2 + 3) × 4 <i data-lucide="arrow-right"></i></button></div></aside></div>`;
  const input = root.querySelector<HTMLTextAreaElement>("#expression")!,
    answer = root.querySelector<HTMLOutputElement>("#answer")!,
    error = root.querySelector<HTMLElement>("#calc-error")!,
    note = root.querySelector<HTMLElement>("#precision-note")!;
  const copyButton = root.querySelector<HTMLButtonElement>("#copy-result")!;
  const renderResult = () => {
    copyButton.disabled = displayed === null;
    if (!displayed) {
      answer.textContent = "—";
      note.textContent =
        "Sem resultado. Corrija a expressão e calcule novamente.";
      return;
    }
    const shown = displayEvaluation(displayed);
    answer.textContent = (shown.approximate ? "≈ " : "") + shown.text;
    note.textContent = shown.approximate
      ? "Aproximação · exibição arredondada conforme suas preferências."
      : "Precisão de cálculo: até 64 algarismos significativos.";
  };
  const invalidate = (e: unknown) => {
    displayed = null;
    renderResult();
    setError(error, e);
  };
  renderResult();
  let justCalculated = false;
  const sync = () => {
    expression = input.value;
    error.hidden = true;
    input.style.height = "auto";
    input.style.height = Math.min(112, input.scrollHeight) + "px";
  };
  const updateMemory = () => {
    const el = root.querySelector<HTMLElement>("#memory-indicator")!;
    el.textContent = memory === null ? "" : "M · memória ativa";
    el.title = memory === null ? "" : `Memória: ${memory}`;
  };
  updateMemory();
  const insert = (text: string) => {
    if (justCalculated && /^[0-9.]$/.test(text)) {
      input.value = "";
      input.setSelectionRange(0, 0);
    } else if (
      justCalculated &&
      ["+", "-", "*", "/", "^", "!", "%"].includes(text)
    ) {
      input.value = "Ans";
      input.setSelectionRange(3, 3);
    }
    justCalculated = false;
    const start = input.selectionStart,
      end = input.selectionEnd;
    input.setRangeText(text, start, end, "end");
    sync();
    input.focus();
  };
  const calculate = () => {
    try {
      const result = evaluate(
          input.value,
          storage.preferences.angle,
          lastResult,
        ),
        shown = displayEvaluation(result);
      lastResult = result.raw;
      displayed = result;
      renderResult();
      error.hidden = true;
      justCalculated = true;
      storage.add(
        "scientific",
        input.value,
        (shown.approximate ? "≈ " : "") + shown.text,
        {
          expression: input.value,
          angle: storage.preferences.angle,
        },
      );
      if (storage.failed)
        toast(
          "Histórico disponível nesta sessão; o navegador bloqueou o armazenamento.",
        );
    } catch (e) {
      invalidate(e);
    }
  };
  const run = (action: string) => {
    try {
      if (action === "calculate") {
        calculate();
        return;
      }
      if (action === "clear") {
        input.value = "";
        sync();
        justCalculated = false;
        displayed = {
          value: decimal.bignumber(0),
          raw: "0",
          approximate: false,
        };
        renderResult();
        note.textContent = "Expressão limpa. Ans e memória foram preservados.";
        input.focus();
        return;
      }
      if (action === "entry") {
        const out = clearEntry(
          input.value,
          input.selectionStart,
          input.selectionEnd,
        );
        input.value = out.text;
        input.setSelectionRange(out.cursor, out.cursor);
        sync();
        justCalculated = false;
        input.focus();
        return;
      }
      if (action === "backspace") {
        const s = input.selectionStart,
          e = input.selectionEnd;
        input.setRangeText("", s === e ? Math.max(0, s - 1) : s, e, "end");
        sync();
        justCalculated = false;
        input.focus();
        return;
      }
      if (action === "sign" || action === "square" || action === "reciprocal") {
        const start = input.selectionStart,
          end = input.selectionEnd,
          selected = input.value.slice(start, end);
        const base = selected || input.value || "0",
          text =
            action === "sign"
              ? `-(${base})`
              : action === "square"
                ? `(${base})^2`
                : `1/(${base})`;
        if (!selected) {
          input.value = text;
          input.setSelectionRange(text.length, text.length);
          sync();
        } else insert(text);
        justCalculated = false;
        input.focus();
        return;
      }
      if (action === "MC") {
        memory = null;
        updateMemory();
        toast("Memória limpa.");
        return;
      }
      if (action === "MR") {
        if (memory === null) {
          toast("A memória está vazia. Use MS para armazenar.");
          return;
        }
        insert(`(${memory})`);
        return;
      }
      if (["MS", "M+", "M−"].includes(action)) {
        const raw = input.value.trim()
          ? evaluate(input.value, storage.preferences.angle, lastResult).raw
          : (displayed?.raw ?? "0");
        memory =
          action === "MS"
            ? raw
            : action === "M+"
              ? decimal
                  .add(decimal.bignumber(memory ?? 0), decimal.bignumber(raw))
                  .toString()
              : decimal
                  .subtract(
                    decimal.bignumber(memory ?? 0),
                    decimal.bignumber(raw),
                  )
                  .toString();
        updateMemory();
        toast("Memória atualizada.");
        return;
      }
      insert(action);
    } catch (e) {
      invalidate(e);
    }
  };
  root
    .querySelectorAll<HTMLButtonElement>("[data-key]")
    .forEach((b) => (b.onclick = () => run(b.dataset.key!)));
  root.querySelectorAll<HTMLButtonElement>("[data-angle]").forEach(
    (b) =>
      (b.onclick = () => {
        storage.setPreferences({ angle: b.dataset.angle as "DEG" | "RAD" });
        root
          .querySelectorAll("[data-angle]")
          .forEach((el) =>
            el.setAttribute(
              "aria-pressed",
              String(
                (el as HTMLElement).dataset.angle === storage.preferences.angle,
              ),
            ),
          );
      }),
  );
  input.oninput = () => {
    justCalculated = false;
    sync();
  };
  const flash = (action: string) => {
    const key = Array.from(
      root.querySelectorAll<HTMLElement>("[data-key]"),
    ).find((b) => b.dataset.key === action);
    if (key) {
      key.classList.add("pressed");
      setTimeout(() => key.classList.remove("pressed"), 160);
    }
  };
  const onKey = (event: KeyboardEvent) => {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.isComposing ||
      event.defaultPrevented ||
      document.querySelector("dialog[open]")
    )
      return;
    const target = event.target as HTMLElement;
    if (
      target !== input &&
      (target.matches(
        'input,textarea,select,[contenteditable="true"],button,a,summary',
      ) ||
        target.closest('[role="dialog"]'))
    )
      return;
    const action = (
      {
        Enter: "calculate",
        "=": "calculate",
        Escape: "clear",
        Delete: "entry",
        Backspace: "backspace",
        ",": ".",
      } as Record<string, string>
    )[event.key];
    if (action) {
      event.preventDefault();
      flash(action);
      run(action);
      return;
    }
    if (target === input) {
      if (/^[0-9+\-*/().^%]$/.test(event.key)) {
        event.preventDefault();
        flash(event.key);
        insert(event.key);
      }
      return;
    }
    if (/^[0-9+\-*/().^%]$/.test(event.key) || /^[a-zA-Z!]$/.test(event.key)) {
      event.preventDefault();
      flash(event.key);
      insert(event.key);
    }
  };
  document.addEventListener("keydown", onKey);
  copyButton.onclick = () => {
    if (displayed) void copy(displayed.raw);
  };
  root.querySelector<HTMLButtonElement>("#science-example")!.onclick = () => {
    input.value = "(2 + 3) * 4";
    sync();
    input.focus();
  };
  root.querySelector<HTMLButtonElement>("#keyboard-help")!.onclick = () =>
    window.dispatchEvent(new CustomEvent("openhelp"));
  sync();
  icons();
  return () => {
    expression = input.value;
    document.removeEventListener("keydown", onKey);
  };
}
