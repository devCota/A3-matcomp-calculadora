/** Limites explícitos impedem operações que bloqueariam a interface. */
export const MAX_N = 5000;
export function integer(value: unknown, name = "n", max = MAX_N): number {
  const n = typeof value === "number" ? value : Number(value);
  if (value === "" || !Number.isSafeInteger(n) || n < 0 || n > max)
    throw new Error(`${name} deve ser inteiro entre 0 e ${max}.`);
  return n;
}
export function factorial(value: number): bigint {
  const n = integer(value);
  let result = 1n;
  for (let i = 2; i <= n; i++) result *= BigInt(i);
  return result;
}
export function arrangement(n: number, k: number): bigint {
  integer(n);
  integer(k, "k");
  if (k > n) throw new Error("k não pode ser maior que n.");
  let result = 1n;
  for (let i = 0; i < k; i++) result *= BigInt(n - i);
  return result;
}
export function combination(n: number, k: number): bigint {
  integer(n);
  integer(k, "k");
  if (k > n) throw new Error("k não pode ser maior que n.");
  k = Math.min(k, n - k);
  let result = 1n;
  for (let i = 1; i <= k; i++)
    result = (result * BigInt(n - k + i)) / BigInt(i);
  return result;
}
export function repeatedPermutation(n: number, groups: number[]): bigint {
  integer(n);
  if (!groups.length || groups.some((g) => !Number.isSafeInteger(g) || g <= 0))
    throw new Error("Informe grupos com quantidades inteiras positivas.");
  if (groups.reduce((a, b) => a + b, 0) !== n)
    throw new Error("A soma das repetições deve ser igual a n.");
  return groups.reduce((total, g) => total / factorial(g), factorial(n));
}
export function repeatedCombination(n: number, k: number): bigint {
  integer(n);
  integer(k, "k");
  if (n === 0) return k === 0 ? 1n : 0n;
  if (n + k - 1 > MAX_N)
    throw new Error(`n + k − 1 deve ser no máximo ${MAX_N}.`);
  return combination(n + k - 1, k);
}
