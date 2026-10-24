import { decimal, type Evaluation } from "./math/expression-engine";
import { storage } from "./services/storage";
export function escapeHTML(value: unknown): string {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export function displayNumber(value: number | string, force?: number): string {
  const p = storage.preferences,
    digits = force ?? p.digits;
  try {
    const n = decimal.bignumber(value);
    let out: string;
    if (p.notation === "fixed") out = n.toFixed(digits);
    else if (p.notation === "scientific") out = n.toExponential(digits - 1);
    else out = n.toSignificantDigits(digits).toString();
    return out.replace(".", ",");
  } catch {
    return String(value);
  }
}
export function displayEvaluation(e: Evaluation): {
  text: string;
  approximate: boolean;
} {
  const text = displayNumber(e.raw);
  const shown = decimal.bignumber(text.replace(",", "."));
  return { text, approximate: e.approximate || !shown.eq(e.value) };
}
let toastTimeout: ReturnType<typeof setTimeout>;
export function toast(message: string) {
  const node = document.querySelector<HTMLElement>("#toast")!;
  node.textContent = message;
  node.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => node.classList.remove("visible"), 3000);
}
export async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Resultado copiado.");
  } catch {
    toast("Não foi possível copiar. Selecione o resultado e use Ctrl+C.");
  }
}
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível calcular. Confira os valores.";
}
export function numberValue(form: HTMLFormElement, name: string): number {
  const input = form.elements.namedItem(name) as HTMLInputElement;
  const raw = input.value.trim().replace(",", ".");
  if (!raw)
    throw new Error(
      `Preencha o campo ${input.labels?.[0]?.textContent?.trim() || name}.`,
    );
  const n = Number(raw);
  if (!Number.isFinite(n))
    throw new Error(
      "Informe números reais finitos, usando ponto ou vírgula decimal.",
    );
  return n;
}
export function download(
  text: string,
  filename: string,
  type = "text/plain;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function setError(node: HTMLElement, error: unknown) {
  node.textContent = errorMessage(error);
  node.hidden = false;
}
export function icons() {
  window.dispatchEvent(new CustomEvent("rendericons"));
}
export function pageHeading(title: string, description: string) {
  return `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div><span class="local-status"><span></span> Tudo no seu navegador</span></div>`;
}
export function field(
  label: string,
  name: string,
  value: string | number,
  type = "text",
  attrs = "",
) {
  return `<label class="field">${label}<input name="${name}" type="${type}" value="${escapeHTML(value)}" ${attrs}></label>`;
}
