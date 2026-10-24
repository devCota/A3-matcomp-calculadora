import { compileExpression, type Angle } from "./expression-engine";
export interface Iteration {
  i: number;
  x: number;
  fx: number;
  error: number | null;
  a?: number;
  b?: number;
}
export interface RootResult {
  root: number;
  residual: number;
  converged: boolean;
  reason: string;
  iterations: Iteration[];
}
export interface RootOptions {
  tolerance: number;
  maxIterations: number;
  angle?: Angle;
}
export function validateOptions(o: RootOptions) {
  if (!Number.isFinite(o.tolerance) || o.tolerance < 1e-12 || o.tolerance > 0.1)
    throw new Error("A tolerância deve estar entre 10⁻¹² e 0,1.");
  if (
    !Number.isInteger(o.maxIterations) ||
    o.maxIterations < 1 ||
    o.maxIterations > 500
  )
    throw new Error("Use entre 1 e 500 iterações.");
}
function finite(...values: number[]) {
  if (values.some((v) => !Number.isFinite(v) || Math.abs(v) > 1e12))
    throw new Error(
      "Os valores devem ser reais finitos, com módulo de até 10¹².",
    );
}
export function bisection(
  expression: string,
  a: number,
  b: number,
  o: RootOptions,
): RootResult {
  validateOptions(o);
  finite(a, b);
  if (a >= b) throw new Error("O limite a deve ser menor que b.");
  const f = compileExpression(expression, true),
    at = (x: number) => f.at(x, o.angle);
  let fa = at(a),
    fb = at(b);
  const iterations: Iteration[] = [];
  if (fa === 0 || fb === 0) {
    const root = fa === 0 ? a : b;
    return {
      root,
      residual: 0,
      converged: true,
      reason: "Raiz encontrada em uma extremidade.",
      iterations: [{ i: 0, x: root, fx: 0, error: 0, a, b }],
    };
  }
  if (Math.sign(fa) === Math.sign(fb))
    throw new Error(
      "A bisseção exige sinais opostos em f(a) e f(b). Escolha outro intervalo.",
    );
  let x = a,
    fx = fa;
  for (let i = 1; i <= o.maxIterations; i++) {
    x = a + (b - a) / 2;
    fx = at(x);
    const error = (b - a) / 2;
    iterations.push({ i, x, fx, error, a, b });
    if (fx === 0 || (error <= o.tolerance && Math.abs(fx) <= o.tolerance))
      return {
        root: x,
        residual: Math.abs(fx),
        converged: true,
        reason:
          fx === 0
            ? "Valor da função igual a zero."
            : "Semilargura do intervalo e residual dentro da tolerância.",
        iterations,
      };
    if (x === a || x === b)
      return {
        root: x,
        residual: Math.abs(fx),
        converged: false,
        reason:
          "Limite da precisão de ponto flutuante atingido sem residual suficiente.",
        iterations,
      };
    if (Math.sign(fa) === Math.sign(fx)) {
      a = x;
      fa = fx;
    } else {
      b = x;
      fb = fx;
    }
  }
  return {
    root: x,
    residual: Math.abs(fx),
    converged: false,
    reason:
      "Limite de iterações atingido. Continuidade não é comprovada automaticamente.",
    iterations,
  };
}
/** Derivada central adaptativa. Não usa diferença de passos como erro verdadeiro. */
export function newton(
  expression: string,
  x0: number,
  o: RootOptions,
): RootResult {
  validateOptions(o);
  finite(x0);
  const f = compileExpression(expression, true),
    at = (x: number) => f.at(x, o.angle);
  const iterations: Iteration[] = [];
  let x = x0,
    fx = at(x);
  if (fx === 0)
    return {
      root: x,
      residual: 0,
      converged: true,
      reason: "A aproximação inicial já zera a função.",
      iterations: [{ i: 0, x, fx, error: 0 }],
    };
  for (let i = 1; i <= o.maxIterations; i++) {
    const h = Math.cbrt(Number.EPSILON) * Math.max(1, Math.abs(x));
    let slope: number;
    try {
      slope = (at(x + h) - at(x - h)) / (2 * h);
    } catch {
      return {
        root: x,
        residual: Math.abs(fx),
        converged: false,
        reason: "Não foi possível estimar a derivada no domínio real.",
        iterations,
      };
    }
    if (!Number.isFinite(slope) || Math.abs(slope) < 1e-14)
      return {
        root: x,
        residual: Math.abs(fx),
        converged: false,
        reason:
          "Derivada nula ou muito pequena. Tente outra aproximação inicial.",
        iterations,
      };
    const next = x - fx / slope;
    if (!Number.isFinite(next) || Math.abs(next) > 1e12)
      return {
        root: x,
        residual: Math.abs(fx),
        converged: false,
        reason: "O método divergiu para fora do intervalo numérico suportado.",
        iterations,
      };
    const error = Math.abs(next - x);
    let nextFx: number;
    try {
      nextFx = at(next);
    } catch {
      return {
        root: x,
        residual: Math.abs(fx),
        converged: false,
        reason: "A iteração saiu do domínio real da função.",
        iterations,
      };
    }
    x = next;
    fx = nextFx;
    iterations.push({ i, x, fx, error });
    if (
      fx === 0 ||
      (error <= o.tolerance * Math.max(1, Math.abs(x)) &&
        Math.abs(fx) <= o.tolerance)
    )
      return {
        root: x,
        residual: Math.abs(fx),
        converged: true,
        reason: "Residual e passo relativo dentro da tolerância.",
        iterations,
      };
    if (error === 0)
      return {
        root: x,
        residual: Math.abs(fx),
        converged: false,
        reason: "Estagnação sem atingir o residual solicitado.",
        iterations,
      };
  }
  return {
    root: x,
    residual: Math.abs(fx),
    converged: false,
    reason: "Limite de iterações atingido sem convergência.",
    iterations,
  };
}
export function secant(
  expression: string,
  a: number,
  b: number,
  o: RootOptions,
): RootResult {
  validateOptions(o);
  finite(a, b);
  if (a === b)
    throw new Error("As aproximações iniciais devem ser diferentes.");
  const f = compileExpression(expression, true),
    at = (x: number) => f.at(x, o.angle);
  let fa = at(a),
    fb = at(b);
  const iterations: Iteration[] = [];
  if (fa === 0 || fb === 0) {
    const root = fa === 0 ? a : b;
    return {
      root,
      residual: 0,
      converged: true,
      reason: "Uma aproximação inicial já zera a função.",
      iterations: [{ i: 0, x: root, fx: 0, error: 0 }],
    };
  }
  for (let i = 1; i <= o.maxIterations; i++) {
    const denominator = fb - fa;
    if (
      Math.abs(denominator) <
      Number.EPSILON * Math.max(1, Math.abs(fa), Math.abs(fb))
    )
      return {
        root: b,
        residual: Math.abs(fb),
        converged: false,
        reason: "Diferença entre os valores da função muito pequena.",
        iterations,
      };
    const x = b - (fb * (b - a)) / denominator;
    finite(x);
    const fx = at(x),
      error = Math.abs(x - b);
    iterations.push({ i, x, fx, error });
    if (
      fx === 0 ||
      (error <= o.tolerance * Math.max(1, Math.abs(x)) &&
        Math.abs(fx) <= o.tolerance)
    )
      return {
        root: x,
        residual: Math.abs(fx),
        converged: true,
        reason: "Residual e passo relativo dentro da tolerância.",
        iterations,
      };
    a = b;
    fa = fb;
    b = x;
    fb = fx;
  }
  return {
    root: b,
    residual: Math.abs(fb),
    converged: false,
    reason: "Limite de iterações atingido sem convergência.",
    iterations,
  };
}
export interface IntegralResult {
  value: number;
  subdivisions: number;
  method: "trapezoid" | "simpson";
  samples: [number, number][];
}
export function integrate(
  expression: string,
  a: number,
  b: number,
  n: number,
  method: "trapezoid" | "simpson",
  angle: Angle = "RAD",
): IntegralResult {
  finite(a, b);
  if (a >= b)
    throw new Error("O limite inferior deve ser menor que o superior.");
  if (!Number.isInteger(n) || n < 2 || n > 10000)
    throw new Error("Use de 2 a 10000 subdivisões inteiras.");
  if (method === "simpson" && n % 2)
    throw new Error("Simpson 1/3 exige um número par de subdivisões.");
  const f = compileExpression(expression, true),
    h = (b - a) / n;
  let sum = 0,
    correction = 0;
  const samples: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = i === n ? b : a + i * h,
      y = f.at(x, angle);
    const weight =
      i === 0 || i === n ? 1 : method === "simpson" ? (i % 2 ? 4 : 2) : 2;
    // Soma compensada de Kahan reduz a perda por cancelamento.
    const term = weight * y - correction,
      temp = sum + term;
    correction = temp - sum - term;
    sum = temp;
    if (i % Math.max(1, Math.ceil(n / 400)) === 0 || i === n)
      samples.push([x, y]);
  }
  const value = (sum * h) / (method === "simpson" ? 3 : 2);
  if (!Number.isFinite(value))
    throw new Error("Integral fora do limite numérico.");
  return { value, subdivisions: n, method, samples };
}
