import { all, create, type MathNode, type BigNumber } from "mathjs";
import { factorial } from "./combinatorics";
export type Angle = "DEG" | "RAD";
export const decimal = create(all, {
  number: "BigNumber",
  precision: 64,
  predictable: true,
});
type Node = MathNode & {
  value?: number | string;
  name?: string;
  op?: string;
  fn?: string | MathNode;
  args?: Node[];
  content?: Node;
};
const FUNCTIONS = new Set([
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "sinh",
  "cosh",
  "tanh",
  "sqrt",
  "nthRoot",
  "abs",
  "factorial",
  "log10",
  "log",
  "ln",
  "exp",
  "round",
  "floor",
  "ceil",
  "mod",
  "pow",
]);
const OPERATORS = new Set(["+", "-", "*", "/", "^", "!", "%"]);
export function normalize(input: string): string {
  return input
    .trim()
    .replace(/(?<=\d),(?=\d)/g, ".")
    .replace(/^f\(x\)\s*=\s*/i, "")
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–]/g, "-")
    .replace(/π/g, "pi")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/√\s*\(/g, "sqrt(")
    .replace(/\bsen\b/gi, "sin")
    .replace(/\barcsen\b/gi, "asin")
    .replace(/\barccos\b/gi, "acos")
    .replace(/\barctan\b/gi, "atan")
    .replace(/\bsenh\b/gi, "sinh")
    .replace(/\braiz\b/gi, "nthRoot");
}
function validate(root: Node, allowX: boolean) {
  let count = 0;
  const visit = (node: Node, depth: number) => {
    if (++count > 160 || depth > 32)
      throw new Error("Expressão muito complexa. Divida o cálculo em etapas.");
    if (node.type === "ConstantNode") {
      if (
        typeof node.value === "boolean" ||
        typeof node.value === "string" ||
        !/^\d*\.?\d+(?:e[+-]?\d+)?$/i.test(String(node.value))
      )
        throw new Error("Use somente números reais.");
      return;
    }
    if (node.type === "SymbolNode") {
      if (!["pi", "e", "Ans", ...(allowX ? ["x"] : [])].includes(node.name!))
        throw new Error(`Símbolo não permitido: ${node.name}.`);
      return;
    }
    if (node.type === "ParenthesisNode") {
      visit(node.content!, depth + 1);
      return;
    }
    if (node.type === "OperatorNode") {
      if (!OPERATORS.has(node.op!)) throw new Error("Operador não permitido.");
      node.args!.forEach((n) => visit(n, depth + 1));
      return;
    }
    if (node.type === "FunctionNode") {
      const name = (node.fn as Node)?.name;
      if (!name || !FUNCTIONS.has(name))
        throw new Error(`Função não permitida: ${name || "desconhecida"}.`);
      if (node.args!.length < 1 || node.args!.length > 2)
        throw new Error("Confira a quantidade de argumentos da função.");
      node.args!.forEach((n) => visit(n, depth + 1));
      return;
    }
    throw new Error(
      "Use apenas expressões matemáticas, sem comandos, listas ou atribuições.",
    );
  };
  visit(root, 0);
}
export interface Evaluation {
  value: BigNumber;
  raw: string;
  approximate: boolean;
}
// Representa um decimal finito como inteiro × 10^expoente, sem arredondar.
// A prova de exatidão usa BigInt: multiplicar novamente com 64 dígitos
// poderia ocultar justamente o arredondamento que queremos detectar.
function exactDecimalParts(value: BigNumber) {
  const [mantissa, exponent] = value.toExponential().split("e");
  return {
    coefficient: BigInt(mantissa.replace(".", "")),
    exponent: BigInt(exponent) - BigInt(mantissa.split(".")[1]?.length ?? 0),
  };
}
function exactProductEquals(
  a: unknown,
  b: unknown,
  expected: unknown,
): boolean {
  if (
    !decimal.isBigNumber(a) ||
    !decimal.isBigNumber(b) ||
    !decimal.isBigNumber(expected)
  )
    return false;
  const left = exactDecimalParts(a),
    right = exactDecimalParts(b),
    target = exactDecimalParts(expected);
  let coefficient = left.coefficient * right.coefficient;
  if (coefficient === 0n) return target.coefficient === 0n;
  let exponent = left.exponent + right.exponent;
  while (coefficient % 10n === 0n) {
    coefficient /= 10n;
    exponent++;
  }
  return coefficient === target.coefficient && exponent === target.exponent;
}
function exactRootEquals(
  root: unknown,
  index: number,
  expected: unknown,
): boolean {
  if (!decimal.isBigNumber(root) || !decimal.isBigNumber(expected))
    return false;
  const result = exactDecimalParts(root),
    target = exactDecimalParts(expected);
  if (result.coefficient === 0n) return target.coefficient === 0n;
  if (result.exponent * BigInt(index) !== target.exponent) return false;
  const digits = result.coefficient.toString().replace("-", "").length;
  const targetDigits = target.coefficient.toString().replace("-", "").length;
  // Evita potências grandes quando a quantidade de algarismos já prova desigualdade.
  if ((digits - 1) * index + 1 > targetDigits || digits * index < targetDigits)
    return false;
  return result.coefficient ** BigInt(index) === target.coefficient;
}

export function compileExpression(input: string, allowX = false) {
  const source = normalize(input);
  if (!source) throw new Error("Digite uma expressão para calcular.");
  if (source.length > 512)
    throw new Error("A expressão deve ter no máximo 512 caracteres.");
  // Vírgula decimal é aceita apenas fora de chamadas com argumentos. Use ponto e ponto-e-vírgula nos exemplos com base/índice.
  let ast: Node;
  try {
    ast = decimal.parse(source.replace(/;/g, ",")) as Node;
  } catch {
    throw new Error(
      "Expressão incompleta ou inválida. Confira os parênteses e operadores.",
    );
  }
  validate(ast, allowX);
  return {
    source,
    evaluate(
      angle: Angle = "RAD",
      scope: { x?: number; Ans?: string } = {},
      fast = false,
    ): Evaluation {
      let approximate = false;
      const M: any = fast ? Math : decimal;
      const b = (v: any): any => (fast ? Number(v) : decimal.bignumber(v));
      const num = (v: any): number => Number(v.toString());
      const zero = (v: any) => (fast ? v === 0 : v.isZero());
      const unary = (fn: string, a: any): any =>
        fast ? (M[fn] as Function)(num(a)) : (M[fn] as Function)(a);
      const checkAdd = (a: any, c: any) => {
        if (
          !fast &&
          !a.isZero() &&
          !c.isZero() &&
          Math.max(a.e, c.e) -
            Math.min(a.e - a.precision() + 1, c.e - c.precision() + 1) +
            2 >
            64
        )
          approximate = true;
      };
      const add = (a: any, c: any) => {
        checkAdd(a, c);
        return fast ? a + c : decimal.add(a, c);
      };
      const sub = (a: any, c: any) => {
        checkAdd(a, c);
        return fast ? a - c : decimal.subtract(a, c);
      };
      const mul = (a: any, c: any) => {
        if (!fast && a.precision() + c.precision() > 64) approximate = true;
        return fast ? a * c : decimal.multiply(a, c);
      };
      const div = (a: any, c: any) => {
        if (zero(c)) throw new Error("Não é possível dividir por zero.");
        const result = fast ? a / c : decimal.divide(a, c);
        if (!fast && !exactProductEquals(result, c, a)) approximate = true;
        return result;
      };
      const power = (a: any, c: any) => {
        if (Math.abs(num(c)) > 10000)
          throw new Error("O expoente deve estar entre −10000 e 10000.");
        if (zero(a) && num(c) <= 0)
          throw new Error(
            "Zero elevado a expoente zero ou negativo é indefinido neste sistema.",
          );
        if (num(a) < 0 && !Number.isInteger(num(c)))
          throw new Error(
            "Potência fora do domínio real. Use raiz de índice ímpar para bases negativas.",
          );
        if (
          !Number.isInteger(num(c)) ||
          (!fast && a.precision() * Math.abs(num(c)) > 64)
        )
          approximate = true;
        return fast ? Math.pow(a, c) : decimal.pow(a, c);
      };
      const call = (name: string, args: any[]): any => {
        const [a, c] = args;
        const x = num(a);
        const arity = ["nthRoot", "mod", "pow"].includes(name)
          ? 2
          : name === "log"
            ? args.length
            : 1;
        if (
          args.length !== arity ||
          (name === "log" && args.length !== 1 && args.length !== 2)
        )
          throw new Error(`${name}: confira a quantidade de argumentos.`);
        if (
          [
            "sin",
            "cos",
            "tan",
            "asin",
            "acos",
            "atan",
            "sinh",
            "cosh",
            "tanh",
            "log",
            "log10",
            "ln",
            "exp",
          ].includes(name)
        )
          approximate = true;
        if (["sin", "cos", "tan"].includes(name)) {
          const r =
            angle === "DEG"
              ? mul(a, div(b(fast ? Math.PI : decimal.pi), b(180)))
              : a;
          if (name === "tan" && Math.abs(Math.cos(num(r))) < 1e-14)
            throw new Error("Tangente indefinida nesse ângulo.");
          return unary(name, r);
        }
        if (["asin", "acos", "atan"].includes(name)) {
          if (name !== "atan" && Math.abs(x) > 1)
            throw new Error("A função inversa exige valor entre −1 e 1.");
          const result = unary(name, a);
          return angle === "DEG"
            ? mul(result, div(b(180), b(fast ? Math.PI : decimal.pi)))
            : result;
        }
        if (name === "sqrt") {
          if (x < 0)
            throw new Error(
              "A raiz quadrada exige número não negativo no conjunto real.",
            );
          const result = unary("sqrt", a);
          if (!fast && !exactRootEquals(result, 2, a)) approximate = true;
          return result;
        }
        if (name === "nthRoot") {
          const index = num(c);
          if (!Number.isInteger(index) || index < 1 || index > 1000)
            throw new Error(
              "O índice da raiz deve ser inteiro entre 1 e 1000.",
            );
          if (x < 0 && index % 2 === 0)
            throw new Error(
              "Raiz de índice par de número negativo não é real.",
            );
          const result = fast
            ? x < 0
              ? -Math.pow(-x, 1 / index)
              : Math.pow(x, 1 / index)
            : decimal.nthRoot(a, c);
          if (!fast && !exactRootEquals(result, index, a)) approximate = true;
          return result;
        }
        if (["log", "ln", "log10"].includes(name)) {
          if (x <= 0)
            throw new Error("Logaritmos reais exigem número positivo.");
          if (c !== undefined && (num(c) <= 0 || num(c) === 1))
            throw new Error(
              "A base do logaritmo deve ser positiva e diferente de 1.",
            );
          // log(x), como na calculadora, usa base 10; ln(x) usa base e.
          return name === "ln"
            ? unary("log", a)
            : fast
              ? Math.log(x) / Math.log(c === undefined ? 10 : num(c))
              : decimal.log(a, c === undefined ? b(10) : c);
        }
        if (name === "factorial") {
          if (fast && x > 170)
            throw new Error(
              "Fatorial fora do limite do cálculo em ponto flutuante.",
            );
          const result = factorial(x).toString();
          return b(result);
        }
        if (name === "pow") return power(a, c);
        if (name === "mod") {
          if (zero(c))
            throw new Error("O divisor do módulo não pode ser zero.");
          if (num(c) < 0) throw new Error("O módulo exige divisor positivo.");
          return fast ? ((a % c) + c) % c : decimal.mod(a, c);
        }
        if (name === "abs") return unary("abs", a);
        if (["floor", "ceil", "round"].includes(name)) return unary(name, a);
        if (["sinh", "cosh", "tanh", "exp"].includes(name)) {
          if (Math.abs(x) > 1000)
            throw new Error(
              "Argumento muito grande. Use um valor entre −1000 e 1000.",
            );
          return unary(name, a);
        }
        throw new Error("Função indisponível.");
      };
      const walk = (node: Node): any => {
        if (node.type === "ConstantNode") return b(node.value!);
        if (node.type === "SymbolNode") {
          if (node.name === "pi" || node.name === "e") {
            approximate = true;
            return b(
              fast
                ? node.name === "pi"
                  ? Math.PI
                  : Math.E
                : node.name === "pi"
                  ? decimal.pi
                  : decimal.e,
            );
          }
          return b(node.name === "Ans" ? (scope.Ans ?? "0") : (scope.x ?? 0));
        }
        if (node.type === "ParenthesisNode") return walk(node.content!);
        if (node.type === "FunctionNode")
          return call((node.fn as Node).name!, node.args!.map(walk));
        const values = node.args!.map(walk),
          [a, c] = values;
        if (node.op === "+") return c === undefined ? a : add(a, c);
        if (node.op === "-") return c === undefined ? mul(b(-1), a) : sub(a, c);
        if (node.op === "*") return mul(a, c);
        if (node.op === "/") return div(a, c);
        if (node.op === "^") return power(a, c);
        if (node.op === "!") return call("factorial", [a]);
        if (node.op === "%") return div(a, b(100));
        throw new Error("Operação não permitida.");
      };
      try {
        const result = walk(ast);
        const value: BigNumber = fast ? decimal.bignumber(result) : result;
        if (
          !value.isFinite() ||
          value.isNaN() ||
          Math.abs(value.e ?? 0) > 20000
        )
          throw new Error("Resultado fora do limite numérico suportado.");
        if (value.precision() >= 64) approximate = true;
        return { value, raw: value.toString(), approximate };
      } catch (error) {
        if (
          error instanceof Error &&
          /^(Não |A |O |Use |Zero |Potência|Raiz|Logaritmos|Tangente|Resultado|Argumento|Símbolo|Função|[a-z]+:|n deve)/.test(
            error.message,
          )
        )
          throw error;
        throw new Error(
          "Não foi possível calcular no conjunto real. Confira os valores e o domínio.",
        );
      }
    },
    at(x: number, angle: Angle = "RAD"): number {
      const n = Number(this.evaluate(angle, { x }, true).raw);
      if (!Number.isFinite(n))
        throw new Error("A função não tem valor real finito nesse ponto.");
      return n;
    },
  };
}
export function evaluate(
  input: string,
  angle: Angle = "RAD",
  Ans = "0",
): Evaluation {
  return compileExpression(input).evaluate(angle, { Ans });
}
export function evaluateFunction(
  input: string,
  x: number,
  angle: Angle = "RAD",
): Evaluation {
  if (!Number.isFinite(x))
    throw new Error("Informe um valor real finito para x.");
  return compileExpression(input, true).evaluate(angle, { x });
}
