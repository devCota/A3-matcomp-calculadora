import {
  factorial,
  arrangement,
  combination,
  repeatedPermutation,
  repeatedCombination,
  integer,
} from "../math/combinatorics";
import { storage } from "../services/storage";
import {
  copy,
  escapeHTML,
  field,
  icons,
  numberValue,
  pageHeading,
  setError,
} from "../utils";
export function mountCombinatorics(
  root: HTMLElement,
  payload?: Record<string, unknown>,
): () => void {
  root.innerHTML =
    pageHeading(
      "Combinatória",
      "Conte possibilidades. Sem perder nenhum algarismo.",
    ) +
    `<div class="module-grid"><section class="panel input-panel"><div class="panel-heading"><h2>O que vamos contar?</h2><i data-lucide="shuffle"></i></div><form id="combo-form"><label class="field">Operação<select name="operation"><option value="combination">Combinação simples · C(n,k)</option><option value="arrangement">Arranjo simples · A(n,k)</option><option value="permutation">Permutação simples · P(n)</option><option value="repeatedPermutation">Permutação com repetição</option><option value="factorial">Fatorial · n!</option><option value="repeatedCombination">Combinação com repetição · CR(n,k)</option></select></label><div class="field-row">${field("Total de elementos · n", "n", 8, "number", 'min="0" max="5000" required')}<div id="k-field">${field("Elementos escolhidos · k", "k", 3, "number", 'min="0" max="5000"')}</div></div><div id="groups-field" hidden>${field("Quantidades de cada grupo", "groups", "3; 2; 1", "text", 'placeholder="Ex.: 3; 2; 1"')}<p class="field-note">Separe os grupos por ponto e vírgula. A soma deve ser igual a n.</p></div><p class="field-note">Inteiros de 0 a 5000. Resultados calculados com BigInt, sem perda de precisão.</p><button type="submit" class="primary"><i data-lucide="equal"></i> Calcular possibilidades</button><p class="error" id="combo-error" role="alert" hidden></p></form><div class="examples"><h3>Experimente</h3><button data-example="committee">Uma equipe de 3 entre 8 <span>C(8,3)</span></button><button data-example="banana">Anagramas de BANANA <span>6 letras, grupos 3; 2; 1</span></button><button data-example="large">Um resultado de 158 algarismos <span>100!</span></button></div></section><div class="result-stack"><section class="panel result-panel"><div class="panel-heading"><h2 id="combo-title">Combinação simples</h2><span class="tag">Exato · BigInt</span></div><div id="combo-formula" class="math-formula">C(n,k) = n! / (k! · (n − k)!)</div><div id="combo-substitution" class="substitution">Escolha os valores e calcule.</div><div class="bigint-answer"><span class="answer-equals">=</span><output id="combo-result" aria-live="polite">—</output></div><div class="result-bottom"><span id="combo-count" class="field-note">Todos os algarismos são preservados.</span><button class="text-button" id="copy-combo"><i data-lucide="copy"></i> Copiar resultado</button></div><p id="combo-explanation" class="result-explanation">Na combinação, a ordem dos elementos escolhidos não altera o grupo.</p></section><section class="guide-panel"><h2>Qual operação usar?</h2><div><span class="guide-mark">P</span><p><strong>Permutação</strong>Ordenar todos os elementos.</p></div><div><span class="guide-mark">A</span><p><strong>Arranjo</strong>Escolher alguns. A ordem importa.</p></div><div><span class="guide-mark">C</span><p><strong>Combinação</strong>Escolher alguns. A ordem não importa.</p></div><p class="field-note">Na permutação com repetição, há elementos indistinguíveis. Na combinação com repetição, uma opção pode ser escolhida várias vezes.</p></section></div></div>`;
  const form = root.querySelector<HTMLFormElement>("form")!,
    select = form.elements.namedItem("operation") as HTMLSelectElement,
    error = root.querySelector<HTMLElement>("#combo-error")!;
  const definitions: Record<
    string,
    { title: string; formula: string; explanation: string }
  > = {
    combination: {
      title: "Combinação simples",
      formula: "C(n,k) = n! / (k! · (n − k)!)",
      explanation:
        "A ordem não importa. Os elementos são distintos e não se repetem.",
    },
    arrangement: {
      title: "Arranjo simples",
      formula: "A(n,k) = n! / (n − k)!",
      explanation:
        "A ordem importa. Os elementos são distintos e não se repetem.",
    },
    permutation: {
      title: "Permutação simples",
      formula: "P(n) = n!",
      explanation: "Todos os n elementos distintos são ordenados.",
    },
    factorial: {
      title: "Fatorial",
      formula: "n! = n · (n − 1) · … · 1",
      explanation:
        "Produto dos inteiros positivos até n. Por definição, 0! = 1.",
    },
    repeatedPermutation: {
      title: "Permutação com repetição",
      formula: "P = n! / (a! · b! · …)",
      explanation:
        "Elementos indistinguíveis dentro de cada grupo. A soma dos grupos deve ser n.",
    },
    repeatedCombination: {
      title: "Combinação com repetição",
      formula: "CR(n,k) = C(n + k − 1, k)",
      explanation:
        "Escolhas sem ordem, permitindo repetir opções. Para n = 0, há uma seleção vazia quando k = 0 e nenhuma quando k > 0.",
    },
  };
  let raw = "";
  const update = () => {
    root.querySelector<HTMLElement>("#k-field")!.hidden = ![
      "combination",
      "arrangement",
      "repeatedCombination",
    ].includes(select.value);
    root.querySelector<HTMLElement>("#groups-field")!.hidden =
      select.value !== "repeatedPermutation";
    const def = definitions[select.value];
    root.querySelector("#combo-title")!.textContent = def.title;
    root.querySelector("#combo-formula")!.textContent = def.formula;
    root.querySelector("#combo-explanation")!.textContent = def.explanation;
    root.querySelector("#combo-result")!.textContent = "—";
    root.querySelector("#combo-substitution")!.textContent =
      "Escolha os valores e calcule.";
    raw = "";
    error.hidden = true;
  };
  select.onchange = update;
  const run = () => {
    error.hidden = true;
    try {
      const n = integer(numberValue(form, "n")),
        op = select.value,
        k = ["combination", "arrangement", "repeatedCombination"].includes(op)
          ? integer(numberValue(form, "k"), "k")
          : 0;
      let result: bigint, substitution: string;
      const groupsRaw = (form.elements.namedItem("groups") as HTMLInputElement)
        .value;
      if (op === "combination") {
        result = combination(n, k);
        substitution = `${n}! / (${k}! · (${n} − ${k})!)`;
      } else if (op === "arrangement") {
        result = arrangement(n, k);
        substitution = `${n}! / (${n} − ${k})!`;
      } else if (op === "repeatedPermutation") {
        const groups = groupsRaw
          .split(/[;,\s]+/)
          .filter(Boolean)
          .map((g) => integer(g, "Cada grupo"));
        result = repeatedPermutation(n, groups);
        substitution = `${n}! / (${groups.map((g) => `${g}!`).join(" · ")})`;
      } else if (op === "repeatedCombination") {
        result = repeatedCombination(n, k);
        substitution = n === 0 ? `CR(0, ${k})` : `C(${n} + ${k} − 1, ${k})`;
      } else {
        result = factorial(n);
        substitution = `${n}!`;
      }
      raw = result.toString();
      root.querySelector("#combo-result")!.textContent = raw;
      root.querySelector("#combo-substitution")!.textContent = substitution;
      root.querySelector("#combo-count")!.textContent =
        `${raw.length} ${raw.length === 1 ? "algarismo" : "algarismos"} · resultado inteiro exato`;
      storage.add(
        "combinatorics",
        `${definitions[op].title}: ${substitution}`,
        raw,
        { operation: op, n, k, groups: groupsRaw },
      );
    } catch (e) {
      setError(error, e);
      root.querySelector("#combo-result")!.textContent = "—";
      raw = "";
    }
  };
  form.onsubmit = (e) => {
    e.preventDefault();
    run();
  };
  root.querySelectorAll<HTMLButtonElement>("[data-example]").forEach(
    (btn) =>
      (btn.onclick = () => {
        const ex = btn.dataset.example!;
        select.value =
          ex === "banana"
            ? "repeatedPermutation"
            : ex === "large"
              ? "factorial"
              : "combination";
        (form.elements.namedItem("n") as HTMLInputElement).value =
          ex === "banana" ? "6" : ex === "large" ? "100" : "8";
        (form.elements.namedItem("k") as HTMLInputElement).value = "3";
        (form.elements.namedItem("groups") as HTMLInputElement).value =
          "3; 2; 1";
        update();
        run();
      }),
  );
  if (payload) {
    if (typeof payload.operation === "string" && definitions[payload.operation])
      select.value = payload.operation;
    for (const name of ["n", "k", "groups"])
      if (payload[name] !== undefined)
        (form.elements.namedItem(name) as HTMLInputElement).value = String(
          payload[name],
        );
  }
  update();
  root.querySelector<HTMLButtonElement>("#copy-combo")!.onclick = () => {
    if (raw) void copy(raw);
  };
  icons();
  return () => {};
}
