import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("rótulos, semântica e contraste dos cinco módulos em ambos os temas", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("h1").waitFor();
  for (const theme of ["light", "dark"]) {
    if (theme === "dark") {
      await page
        .getByRole("button", { name: "Preferências", exact: true })
        .click();
      await page.locator('#settings-form [name="theme"]').selectOption("dark");
      await page.getByRole("button", { name: "Salvar preferências" }).click();
    }
    for (const id of [
      "scientific",
      "functions",
      "matrices",
      "combinatorics",
      "numerical",
    ]) {
      await page.locator(`[data-module="${id}"]`).click();
      await page.locator("h1").waitFor();
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(results.violations, `${theme}/${id}`).toEqual([]);
    }
  }
});
