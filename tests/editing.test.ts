import { describe, expect, it } from "vitest";
import { clearEntry } from "../src/modules/scientific";
describe("CE em expressões editáveis", () => {
  it("remove o literal corrente, preserva o restante", () =>
    expect(clearEntry("12+345")).toEqual({ text: "12+", cursor: 3 }));
  it("remove a seleção, inclusive dentro de função", () =>
    expect(clearEntry("sin(30)+5", 4, 6)).toEqual({
      text: "sin()+5",
      cursor: 4,
    }));
  it("aceita números em notação científica", () =>
    expect(clearEntry("5+1.2e-3")).toEqual({ text: "5+", cursor: 2 }));
  it("edita a partir do cursor, sem apagar o sufixo", () =>
    expect(clearEntry("12+345", 2)).toEqual({ text: "+345", cursor: 0 }));
  it("não remove um operador nem causa erro quando não há entrada", () =>
    expect(clearEntry("2+")).toEqual({ text: "2+", cursor: 2 }));
});
