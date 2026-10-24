# Requisitos e rastreabilidade

Fonte primária: **1ª Entrega · Piratas do cálculo · Matemática Computacional.pdf**, seis páginas, datado de 20/10/2026. O documento foi lido integralmente; não foi copiado para o repositório, pois contém matrículas. O prompt complementar determina teclado e histórico obrigatórios e especifica os algoritmos numéricos.

| Requisito do PDF                  | Implementação                           | Verificação                           |
| --------------------------------- | --------------------------------------- | ------------------------------------- |
| Operações básicas e precedência   | `math/expression-engine.ts`, científica | Vitest e jornada científica           |
| C, CE, backspace, sinal           | `modules/scientific.ts`                 | Jornada e casos de edição             |
| Avaliar f(x)                      | Motor de expressão e tela Funções       | Polinômio em x = 3 e gráfico          |
| Soma e subtração matricial        | `math/matrices.ts`                      | Vitest                                |
| Escalar e produto de matrizes     | `math/matrices.ts`                      | Vitest e jornada                      |
| Determinante                      | Eliminação com pivotamento              | det([[2,-1],[3,4]]) = 11              |
| Fatorial BigInt                   | `math/combinatorics.ts`                 | 0!, 5!, 25!, 100! na interface        |
| Permutação simples e repetição    | Combinatória                            | BANANA = 60                           |
| Arranjo A(n,k)                    | Combinatória                            | A(5,2) = 20                           |
| Combinação C(n,k)                 | Combinatória                            | C(8,3) = 56                           |
| Cálculo numérico diferencial      | Bisseção, Newton, secante e integrações | Raiz de x²−2 e integral de x²         |
| Interface responsiva e identidade | CSS, Lucide, Manrope local              | Chromium em 320/390/768/1440 px       |
| Histórico e teclado               | Serviço local e eventos científicos     | Persistência, NumPad, foco e diálogos |
| Git e README / relatório          | Repositório existente, README e docs    | Inspeção dos arquivos e build         |
| Sem backend                       | Build estático; nenhum endpoint         | Preview da pasta dist                 |

## Complementos implementados

Trigonometrias e inversas DEG/RAD, hiperbólicas, memória, logaritmos de base arbitrária, cópia, gráficos comparativos, transposta/inversa/traço/potência, combinações com repetição, temas e exportações TXT/CSV.

## Limites do documento original

As páginas 1 e 4 usam 2026; a página 6 menciona 2025 para início e entrega final. A frase “14 funcionalidades implementadas” é uma declaração do PDF anterior ao código desta entrega; não foi adotada como resultado de teste. Os resultados efetivamente verificados são documentados em `testes.md`.
