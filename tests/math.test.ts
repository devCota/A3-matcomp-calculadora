import { describe, it, expect } from "vitest";
import {
  evaluate,
  evaluateFunction,
  compileExpression,
} from "../src/math/expression-engine";
import {
  factorial,
  arrangement,
  combination,
  repeatedPermutation,
  repeatedCombination,
} from "../src/math/combinatorics";
import {
  addMatrix,
  subtractMatrix,
  scaleMatrix,
  multiplyMatrix,
  determinant,
  inverse,
  powerMatrix,
  transpose,
} from "../src/math/matrices";
import { bisection, newton, integrate, secant } from "../src/math/numerical";
const numeric = (expr: string, angle: "DEG" | "RAD" = "RAD") =>
  Number(evaluate(expr, angle).raw);
describe("expressões científicas", () => {
  it.each([
    ["2+3", 5],
    ["2+3*4", 14],
    ["(2+3)*4", 20],
    ["sqrt(81)", 9],
    ["ln(e)", 1],
    ["0!", 1],
    ["50%", 0.5],
    ["log(8;2)", 3],
    ["nthRoot(-27;3)", -3],
    ["mod(-7;3)", 2],
    ["2^-3", 0.125],
    ["1e3+2", 1002],
  ])("%s = %s", (expr, result) =>
    expect(numeric(expr)).toBeCloseTo(result, 12),
  );
  it("respeita unidades nas diretas e inversas", () => {
    expect(numeric("sin(30)", "DEG")).toBeCloseTo(0.5, 12);
    expect(numeric("asin(0.5)", "DEG")).toBeCloseTo(30, 10);
    expect(numeric("cos(pi)", "RAD")).toBeCloseTo(-1, 12);
    expect(numeric("atan(1)", "RAD")).toBeCloseTo(Math.PI / 4, 12);
  });
  it("evita o erro decimal binário", () =>
    expect(evaluate("0.1+0.2").raw).toBe("0.3"));
  it("resolve multiplicação implícita e Ans", () => {
    expect(numeric("2(3+1)")).toBe(8);
    expect(evaluate("Ans*2", "RAD", "5").raw).toBe("10");
  });
  it.each([
    "1/0",
    "sqrt(-1)",
    "ln(0)",
    "log(2;1)",
    "(-2)^0.5",
    "(-1)!",
    "1.5!",
    "tan(90)",
  ])("rejeita domínio inválido %s", (expr) =>
    expect(() => evaluate(expr, "DEG")).toThrow(),
  );
  it.each([
    'import("fs")',
    "2;3",
    "a=2",
    "x[0]",
    "[1,2]",
    "true",
    "sqrt.constructor",
    'evaluate("2")',
    "f(x)=x",
    "2+(",
    "foo(2)",
    "factorial(900000)",
    "2^1000000",
  ])("rejeita expressão insegura/inválida %s", (expr) =>
    expect(() => evaluate(expr)).toThrow(),
  );
  it("avalia f(x) e rejeita variável em modo científico", () => {
    expect(evaluateFunction("x²+2x+1", 3).raw).toBe("16");
    expect(() => evaluate("x+1")).toThrow();
    expect(compileExpression("sin(x)", true).at(30, "DEG")).toBeCloseTo(
      0.5,
      12,
    );
  });
});
describe("combinatória exata", () => {
  it("casos do enunciado", () => {
    expect(factorial(5)).toBe(120n);
    expect(factorial(0)).toBe(1n);
    expect(arrangement(5, 2)).toBe(20n);
    expect(combination(8, 3)).toBe(56n);
    expect(repeatedPermutation(6, [3, 2, 1])).toBe(60n);
  });
  it("preserva inteiros acima de Number.MAX_SAFE_INTEGER", () => {
    expect(factorial(25)).toBe(15511210043330985984000000n);
    expect(combination(100, 50)).toBe(100891344545564193334812497256n);
  });
  it("repetição e fronteiras", () => {
    expect(repeatedCombination(3, 2)).toBe(6n);
    expect(repeatedCombination(0, 0)).toBe(1n);
    expect(repeatedCombination(0, 2)).toBe(0n);
    expect(combination(0, 0)).toBe(1n);
  });
  it.each([
    () => factorial(-1),
    () => factorial(2.5),
    () => arrangement(3, 4),
    () => combination(2, 3),
    () => repeatedPermutation(6, [3, 2]),
    () => factorial(5001),
  ])("valida entradas", (fn) => expect(fn).toThrow());
});
describe("matrizes", () => {
  const a = [
      [2, -1],
      [3, 4],
    ],
    b = [
      [1, 2],
      [0, 1],
    ];
  it("soma e subtração", () => {
    expect(addMatrix(a, b)).toEqual([
      [3, 1],
      [3, 5],
    ]);
    expect(subtractMatrix(a, b)).toEqual([
      [1, -3],
      [3, 3],
    ]);
  });
  it("escalar e produto", () => {
    expect(scaleMatrix(a, 2)).toEqual([
      [4, -2],
      [6, 8],
    ]);
    expect(multiplyMatrix(a, b)).toEqual([
      [2, 3],
      [3, 10],
    ]);
  });
  it("determinante com pivotamento", () => {
    expect(determinant(a)).toBeCloseTo(11, 12);
    expect(
      determinant([
        [0, 1],
        [2, 3],
      ]),
    ).toBe(-2);
    expect(
      determinant([
        [1, 2],
        [2, 4],
      ]),
    ).toBe(0);
    expect(
      determinant([
        [1e-12, 0],
        [0, 1e-12],
      ]),
    ).toBeCloseTo(1e-24, 30);
  });
  it("inversa, transposta e potência", () => {
    const product = multiplyMatrix(a, inverse(a));
    expect(product[0][0]).toBeCloseTo(1);
    expect(product[0][1]).toBeCloseTo(0);
    expect(transpose(a)).toEqual([
      [2, 3],
      [-1, 4],
    ]);
    expect(powerMatrix(a, 0)).toEqual([
      [1, 0],
      [0, 1],
    ]);
  });
  it.each([
    () => addMatrix(a, [[1]]),
    () => multiplyMatrix(a, [[1, 2]]),
    () => determinant([[1, 2]]),
    () =>
      inverse([
        [1, 2],
        [2, 4],
      ]),
    () => scaleMatrix([[Infinity]], 1),
  ])("rejeita matrizes inválidas", (fn) => expect(fn).toThrow());
});
describe("métodos numéricos", () => {
  const o = { tolerance: 1e-8, maxIterations: 100 };
  it("bisseção aproxima √2", () => {
    const r = bisection("x^2-2", 0, 2, o);
    expect(r.converged).toBe(true);
    expect(r.root).toBeCloseTo(Math.SQRT2, 7);
    expect(r.residual).toBeLessThan(1e-8);
  });
  it("Newton e secante aproximam √2", () => {
    for (const r of [newton("x^2-2", 1, o), secant("x^2-2", 1, 2, o)]) {
      expect(r.converged).toBe(true);
      expect(r.root).toBeCloseTo(Math.SQRT2, 7);
    }
  });
  it("integra x² de 0 a 1", () => {
    expect(integrate("x^2", 0, 1, 100, "simpson").value).toBeCloseTo(1 / 3, 12);
    expect(integrate("x^2", 0, 1, 1000, "trapezoid").value).toBeCloseTo(
      1 / 3,
      6,
    );
  });
  it("não afirma convergência em polo ou limite de iterações", () => {
    expect(bisection("1/x", -1, 2, { ...o, maxIterations: 40 }).converged).toBe(
      false,
    );
    expect(bisection("x^2-2", 0, 2, { ...o, maxIterations: 1 }).converged).toBe(
      false,
    );
    expect(newton("x^2+1", 0, o).converged).toBe(false);
  });
  it("aceita raiz na extremidade", () =>
    expect(bisection("x", 0, 2, o).root).toBe(0));
  it.each([
    () => bisection("x^2+1", 0, 2, o),
    () => integrate("x^2", 0, 1, 3, "simpson"),
    () => bisection("x", 2, 1, o),
    () => newton("x", 0, { ...o, tolerance: 0 }),
  ])("valida parâmetros", (fn) => expect(fn).toThrow());
});
describe("precisão da entrada e separadores", () => {
  it("preserva literais inteiros longos antes de calcular", () =>
    expect(evaluate("123456789012345678901234567890+1").raw).toBe(
      "1.23456789012345678901234567891e+29",
    ));
  it("aceita vírgula decimal e argumentos com ponto e vírgula", () => {
    expect(evaluate("0,1+0,2").raw).toBe("0.3");
    expect(numeric("log(8;2)")).toBeCloseTo(3);
  });
});
describe("arrendondamento intermediário e funções adicionais", () => {
  it("não declara cancelamento de grande magnitude como exato", () =>
    expect(evaluate("1e80+1-1e80").approximate).toBe(true));
  it.each([
    ["abs(-5)", 5],
    ["round(2.6)", 3],
    ["floor(-2.1)", -3],
    ["ceil(-2.1)", -2],
    ["exp(1)", Math.E],
    ["sinh(0)", 0],
    ["cosh(0)", 1],
    ["tanh(0)", 0],
    ["log10(100)", 2],
    ["pow(2;3)", 8],
  ])("função %s", (expr, n) =>
    expect(Number(evaluate(expr).raw)).toBeCloseTo(n, 12),
  );
});
describe("constantes não matemáticas", () => {
  it.each(['"123"', '"0"', '"1.5"'])("rejeita strings numéricas %s", (source) =>
    expect(() => evaluate(source)).toThrow(),
  );
});

describe("indicação de exatidão", () => {
  it.each([
    "9/3",
    "1/2",
    "1/8",
    "0.3/0.1",
    "0/7",
    "50%",
    "200*10%",
    "sqrt(81)",
    "sqrt(0.09)",
    "nthRoot(27;3)",
    "nthRoot(-27;3)",
  ])("não marca %s como aproximação", (expression) => {
    expect(evaluate(expression).approximate).toBe(false);
  });
  it.each([
    "1/3",
    "1/7",
    "sqrt(2)",
    "nthRoot(2;3)",
    "(1/3)*3",
    "sqrt(2)*sqrt(2)",
  ])("preserva aproximação em %s", (expression) => {
    expect(evaluate(expression).approximate).toBe(true);
  });
  it("não confunde igualdade arredondada com divisão exata", () => {
    // Com precisão finita, (1/3)*3 pode voltar a 1; isso não prova exatidão.
    expect(evaluate("1/3").approximate).toBe(true);
    expect(
      evaluate(
        "1/9999999999999999999999999999999999999999999999999999999999999999",
      ).approximate,
    ).toBe(true);
  });
});
