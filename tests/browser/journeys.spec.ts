import { test, expect } from "@playwright/test";
async function open(page: any, id = "scientific") {
  await page.goto(`/#${id}`);
  await page.locator("h1").waitFor();
}
test("científica, teclado físico, CE, memória, Ans, DEG/RAD e histórico", async ({
  page,
}) => {
  await open(page);
  const input = page.getByRole("textbox", { name: "Expressão científica" }),
    answer = page.locator("#answer");
  await input.focus();
  await page.keyboard.type("2+3*4");
  await page.keyboard.press("Enter");
  await expect(answer).toHaveText("14");
  await page.keyboard.press("+");
  await page.keyboard.type("6");
  await page.keyboard.press("Enter");
  await expect(answer).toHaveText("20");
  await page.keyboard.press("Escape");
  await page.keyboard.type("(2+3)*4");
  await page.keyboard.press("Equal");
  await expect(answer).toHaveText("20");
  await input.fill("12+345");
  await input.press("Delete");
  await expect(input).toHaveValue("12+");
  await input.press("Backspace");
  await expect(input).toHaveValue("12");
  await input.press("Escape");
  await expect(input).toHaveValue("");
  await input.dispatchEvent("keydown", {
    key: "7",
    code: "Numpad7",
    location: 3,
  });
  await input.dispatchEvent("keydown", {
    key: "+",
    code: "NumpadAdd",
    location: 3,
  });
  await input.dispatchEvent("keydown", {
    key: "3",
    code: "Numpad3",
    location: 3,
  });
  await input.dispatchEvent("keydown", {
    key: "Enter",
    code: "NumpadEnter",
    location: 3,
  });
  await expect(answer).toHaveText("10");
  await input.fill("0,1+0,2");
  await input.press("Enter");
  await expect(answer).toHaveText("0,3");
  await input.fill("sin(30)");
  await input.press("Enter");
  await expect(answer).toContainText("0,5");
  await page.getByRole("button", { name: "RAD", exact: true }).click();
  await input.fill("cos(pi)");
  await input.press("Enter");
  await expect(answer).toContainText("-1");
  await input.fill("5");
  await page.getByRole("button", { name: "Armazenar resultado" }).click();
  await expect(page.locator("#memory-indicator")).toContainText("M");
  await page
    .getByRole("button", { name: "Limpar expressão (Escape)", exact: true })
    .click();
  await page.getByRole("button", { name: "Recuperar memória" }).click();
  await input.press("Enter");
  await expect(answer).toHaveText("5");
  await input.fill("1/0");
  await input.press("Enter");
  await expect(page.locator("#calc-error")).toContainText("zero");
  await page
    .getByRole("button", { name: "Histórico", exact: false })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("#history-list .history-entry")).toHaveCount(8);
  await page.getByRole("button", { name: "Fechar histórico" }).click();
  await page.reload();
  await page.locator("h1").waitFor();
  await expect(page.locator("#history-count")).toHaveText("8");
});
test("função e gráfico, matriz, combinatória exata e métodos numéricos", async ({
  page,
}) => {
  await open(page, "functions");
  await page.getByRole("button", { name: "Avaliar e traçar" }).click();
  await expect(page.locator("#function-result")).toHaveText("16");
  await expect(page.locator("canvas")).toBeVisible();
  await page.locator('[data-module="matrices"]').click();
  await page.locator('[name="operation"]').selectOption("det");
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await expect(page.locator(".scalar-result")).toHaveText("11");
  await page.locator('[name="operation"]').selectOption("multiply");
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await expect(page.locator(".matrix-output")).toContainText("10");
  await page.locator('[data-module="combinatorics"]').click();
  await page.getByRole("button", { name: "Calcular possibilidades" }).click();
  await expect(page.locator("#combo-result")).toHaveText("56");
  await page.getByRole("button", { name: "Anagramas de BANANA" }).click();
  await expect(page.locator("#combo-result")).toHaveText("60");
  await page
    .getByRole("button", { name: "Um resultado de 158 algarismos" })
    .click();
  await expect(page.locator("#combo-result")).toHaveText(
    /^933262154439441526816992388562667004/,
  );
  await expect(page.locator("#combo-count")).toContainText("158");
  await page.locator('[data-module="numerical"]').click();
  await page.getByRole("button", { name: "Executar método" }).click();
  await expect(page.locator(".status-chip")).toHaveText(
    "Convergência atingida",
  );
  await expect(page.locator(".numerical-answer")).toContainText("1,414213");
  await expect(page.locator("#iterations-body tr")).not.toHaveCount(0);
  await page.getByRole("button", { name: "Área sob uma parábola" }).click();
  await expect(page.locator(".numerical-answer")).toContainText("0,333333");
  await page.locator('[name="subdivisions"]').fill("3");
  await page.getByRole("button", { name: "Executar método" }).click();
  await expect(page.locator("#numerical-error")).toContainText("par");
});
test("teclado não interfere em formulários, preferências e erros", async ({
  page,
}) => {
  await open(page, "functions");
  const input = page.locator('[name="expression"]');
  await input.fill("x^2 + 3");
  await input.press("End");
  await input.press("Backspace");
  await expect(input).toHaveValue("x^2 + ");
  await page.getByRole("button", { name: "Preferências", exact: true }).click();
  await page.getByLabel("Radianos · RAD").check();
  await page.locator('#settings-form [name="theme"]').selectOption("dark");
  await page.getByRole("button", { name: "Salvar preferências" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator('[data-module="scientific"]').click();
  await expect(
    page.getByRole("button", { name: "RAD", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const expr = page.getByRole("textbox", { name: "Expressão científica" });
  await expr.fill("sqrt(-1)");
  await expr.press("Enter");
  await expect(page.locator("#calc-error")).toBeVisible();
  await page.getByRole("button", { name: "Preferências", exact: true }).click();
  const digits = page.locator('#settings-form [name="digits"]');
  await digits.focus();
  await page.keyboard.press("Escape");
  await expect(page.locator("#settings-dialog")).not.toBeVisible();
  await expect(expr).toHaveValue("sqrt(-1)");
});
test("todos os módulos cabem em telas de 320 e 390 px", async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await open(page);
    await expect(
      page.getByRole("button", { name: "Preferências", exact: true }),
    ).toBeVisible();
    for (const id of [
      "scientific",
      "functions",
      "matrices",
      "combinatorics",
      "numerical",
    ]) {
      await page.locator(`[data-module="${id}"]`).click();
      await page.locator("h1").waitFor();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    }
  }
});

test("memória completa, cópia, reutilização, remoção e exportação", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page);
  const input = page.getByRole("textbox", { name: "Expressão científica" });
  await input.fill("10");
  await page
    .getByRole("button", { name: "Armazenar resultado", exact: true })
    .click();
  await input.fill("2");
  await page
    .getByRole("button", { name: "Somar à memória", exact: true })
    .click();
  await input.fill("3");
  await page
    .getByRole("button", { name: "Subtrair da memória", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Limpar expressão (Escape)", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Recuperar memória", exact: true })
    .click();
  await input.press("Enter");
  await expect(page.locator("#answer")).toHaveText("9");
  await page
    .getByRole("button", { name: "Copiar resultado", exact: true })
    .click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("9");
  await page
    .getByRole("button", { name: "Limpar memória", exact: true })
    .click();
  await expect(page.locator("#memory-indicator")).toBeEmpty();
  await input.fill("4+5");
  await input.press("Enter");
  await page.locator("#open-history").click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar TXT" }).click();
  expect((await download).suggestedFilename()).toBe("piratas-historico.txt");
  await page.locator("#history-list [data-reuse]").first().click();
  await expect(input).toHaveValue("4+5");
  await page.locator("#open-history").click();
  await page.locator("#history-list [data-delete]").first().click();
  await expect(page.locator("#history-list .history-entry")).toHaveCount(1);
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Limpar histórico", exact: true })
    .click();
  await expect(page.locator("#history-list .history-entry")).toHaveCount(0);
});

test("correções de resposta inválida, grades, abas e tabela móvel", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await open(page);
  const input = page.locator("#expression");
  await input.fill("sin(30)");
  await input.press("Enter");
  await page.locator('[data-module="functions"]').click();
  await page.locator('[data-module="scientific"]').click();
  await expect(page.locator("#answer")).toContainText("≈");
  await input.fill("1/0");
  await input.press("Enter");
  await expect(page.locator("#answer")).toHaveText("—");
  await expect(page.locator("#copy-result")).toBeDisabled();
  await input.fill("Ans*2");
  await input.press("Enter");
  await expect(page.locator("#answer")).toContainText("1");
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator('[data-module="matrices"]').click();
    for (const name of ["A", "B"]) {
      const region = page.locator(`[data-grid="${name}"] .matrix-scroll`);
      expect(
        await region.evaluate((e) => e.scrollWidth - e.clientWidth),
      ).toBeLessThanOrEqual(1);
    }
    await page.locator('[data-module="numerical"]').click();
    const tab = page.locator('[data-module="numerical"]');
    const box = await tab.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  }
  await page.getByRole("button", { name: "Executar método" }).click();
  await expect(page.locator("#table-scroll-hint")).toBeVisible();
  await expect(
    page.getByRole("region", {
      name: "Tabela de iterações com rolagem horizontal",
    }),
  ).toHaveAttribute("tabindex", "0");
  await page.locator('[name="expression"]').fill("x");
  await page.getByRole("button", { name: "Executar método" }).click();
  await expect(
    page.locator(".metrics-row>div").last().locator("strong"),
  ).toHaveText("0");
});

test("resultados exatos sem aproximação e arredondamentos identificados", async ({
  page,
}) => {
  await open(page);
  const input = page.locator("#expression"),
    answer = page.locator("#answer");
  for (const [expression, result] of [
    ["9/3", "3"],
    ["1/8", "0,125"],
    ["sqrt(81)", "9"],
    ["nthRoot(-27;3)", "-3"],
  ]) {
    await input.fill(expression);
    await input.press("Enter");
    await expect(answer).toHaveText(result);
  }
  await input.fill("1/3");
  await input.press("Enter");
  await expect(answer).toContainText("≈");
  await page.getByRole("button", { name: "Preferências", exact: true }).click();
  await page.locator('#settings-form [name="digits"]').selectOption("6");
  await page.getByRole("button", { name: "Salvar preferências" }).click();
  await input.fill("1/512");
  await input.press("Enter");
  await expect(answer).toHaveText("≈ 0,00195313");
});
