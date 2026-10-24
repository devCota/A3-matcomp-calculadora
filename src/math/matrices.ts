export type Matrix = number[][];
const LIMIT = 8;
export function validateMatrix(a: Matrix): void {
  if (
    !Array.isArray(a) ||
    !a.length ||
    a.length > LIMIT ||
    !a[0]?.length ||
    a[0].length > LIMIT ||
    a.some(
      (row) =>
        row.length !== a[0].length || row.some((v) => !Number.isFinite(v)),
    )
  )
    throw new Error(
      "Use uma matriz retangular de 1 a 8 linhas e colunas, com valores reais finitos.",
    );
}
function checked(a: Matrix): Matrix {
  validateMatrix(a);
  return a;
}
function result(a: Matrix): Matrix {
  if (a.some((r) => r.some((v) => !Number.isFinite(v))))
    throw new Error(
      "O resultado excedeu o limite numérico. Reduza os valores.",
    );
  return a;
}
function same(a: Matrix, b: Matrix) {
  validateMatrix(a);
  validateMatrix(b);
  if (a.length !== b.length || a[0].length !== b[0].length)
    throw new Error(
      "Soma e subtração exigem matrizes com as mesmas dimensões.",
    );
}
function square(a: Matrix) {
  validateMatrix(a);
  if (a.length !== a[0].length)
    throw new Error("Esta operação exige uma matriz quadrada.");
}
export function addMatrix(a: Matrix, b: Matrix): Matrix {
  same(a, b);
  return result(a.map((r, i) => r.map((v, j) => v + b[i][j])));
}
export function subtractMatrix(a: Matrix, b: Matrix): Matrix {
  same(a, b);
  return result(a.map((r, i) => r.map((v, j) => v - b[i][j])));
}
export function scaleMatrix(a: Matrix, k: number): Matrix {
  validateMatrix(a);
  if (!Number.isFinite(k)) throw new Error("Informe um escalar real finito.");
  return result(a.map((r) => r.map((v) => v * k)));
}
export function multiplyMatrix(a: Matrix, b: Matrix): Matrix {
  validateMatrix(a);
  validateMatrix(b);
  if (a[0].length !== b.length)
    throw new Error(
      "Para A × B, o número de colunas de A deve ser igual ao número de linhas de B.",
    );
  return result(
    a.map((row) =>
      b[0].map((_, j) => row.reduce((sum, v, k) => sum + v * b[k][j], 0)),
    ),
  );
}
export function transpose(a: Matrix): Matrix {
  validateMatrix(a);
  return a[0].map((_, j) => a.map((r) => r[j]));
}
export function identity(n: number): Matrix {
  if (!Number.isInteger(n) || n < 1 || n > LIMIT)
    throw new Error("A dimensão deve estar entre 1 e 8.");
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => Number(i === j)),
  );
}
/** Eliminação de Gauss com pivotamento parcial; tolerância relativa à norma de cada coluna. */
export function determinant(a: Matrix): number {
  square(a);
  const m = a.map((r) => [...r]);
  let det = 1,
    sign = 1;
  for (let j = 0; j < m.length; j++) {
    let p = j;
    for (let i = j + 1; i < m.length; i++)
      if (Math.abs(m[i][j]) > Math.abs(m[p][j])) p = i;
    if (m[p][j] === 0) return 0;
    if (p !== j) {
      [m[p], m[j]] = [m[j], m[p]];
      sign *= -1;
    }
    const pivot = m[j][j];
    det *= pivot;
    for (let i = j + 1; i < m.length; i++) {
      const ratio = m[i][j] / pivot;
      for (let k = j + 1; k < m.length; k++) m[i][k] -= ratio * m[j][k];
      m[i][j] = 0;
    }
  }
  const value = det * sign;
  if (!Number.isFinite(value))
    throw new Error("Determinante fora do limite numérico.");
  return value;
}
export function inverse(a: Matrix): Matrix {
  square(a);
  const n = a.length;
  const unit = identity(n),
    m = a.map((row, i) => [...row, ...unit[i]]);
  const scale = Math.max(...a.flat().map(Math.abs));
  for (let j = 0; j < n; j++) {
    let p = j;
    for (let i = j + 1; i < n; i++)
      if (Math.abs(m[i][j]) > Math.abs(m[p][j])) p = i;
    if (Math.abs(m[p][j]) <= Number.EPSILON * scale * n * 8)
      throw new Error(
        "A matriz é singular ou numericamente próxima de singular; a inversa não é confiável.",
      );
    [m[p], m[j]] = [m[j], m[p]];
    const pivot = m[j][j];
    m[j] = m[j].map((v) => v / pivot);
    for (let i = 0; i < n; i++)
      if (i !== j) {
        const factor = m[i][j];
        m[i] = m[i].map((v, k) => v - factor * m[j][k]);
      }
  }
  return result(m.map((row) => row.slice(n)));
}
export function trace(a: Matrix): number {
  square(a);
  return a.reduce((s, row, i) => s + row[i], 0);
}
export function powerMatrix(a: Matrix, n: number): Matrix {
  square(a);
  if (!Number.isInteger(n) || n < 0 || n > 20)
    throw new Error("A potência matricial deve ser inteira entre 0 e 20.");
  let out = identity(a.length),
    base = checked(a);
  while (n) {
    if (n % 2) out = multiplyMatrix(out, base);
    n = Math.floor(n / 2);
    if (n) base = multiplyMatrix(base, base);
  }
  return out;
}
