import { describe, it, expect } from "vitest";
import { sampleFunction } from "../src/modules/chart";
describe("amostragem de gráficos", () => {
  it("interrompe 1/x no ponto fora do domínio", () =>
    expect(
      sampleFunction("1/x", -1, 1, "RAD", 100).some(([, y]) => y === null),
    ).toBe(true));
  it("não conecta os lados de um polo de tan que não coincide com amostra", () =>
    expect(
      sampleFunction("tan(x)", 1, 2, "RAD", 100).some(
        ([x, y]) => y === null && x > 1.57 && x < 1.58,
      ),
    ).toBe(true));
  it("mantém uma reta íngreme contínua, incluindo mudança de sinal", () =>
    expect(
      sampleFunction("10000*x", -1, 1, "RAD", 99).every(([, y]) => y !== null),
    ).toBe(true));
});
