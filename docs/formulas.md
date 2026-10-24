# Fórmulas e métodos

## Combinatória

- Fatorial: n! = ∏ᵢ₌₁ⁿ i, com 0! = 1.
- Permutação simples: P(n) = n!.
- Permutação com repetição: n! / (a! b! …), com soma dos grupos igual a n.
- Arranjo: A(n,k) = n! / (n−k)!.
- Combinação: C(n,k) = n! / [k!(n−k)!]. Implementação multiplicativa usa o menor entre k e n−k, dividindo exatamente em cada passo.
- Combinação com repetição: CR(n,k) = C(n+k−1,k), n ≥ 1. A seleção vazia é uma possibilidade: CR(0,0) = 1; para k > 0 e n = 0 não há seleções.

Exemplos: 5! = 120; A(5,2) = 20; C(8,3) = 56; BANANA tem 6!/(3!2!1!) = 60 anagramas distintos.

## Bisseção

Com f contínua em [a,b] e sinais opostos nos extremos, calcula x = a + (b−a)/2 e mantém a metade com mudança de sinal. A condição de continuidade é responsabilidade do problema proposto, não é provada pelo programa.

Parada: f(x) = 0, ou **simultaneamente** semilargura (b−a)/2 ≤ tolerância e residual |f(x)| ≤ tolerância. O critério residual adicional impede anunciar sucesso apenas porque um intervalo em torno de um polo ficou estreito. Limite de iterações ou estagnação sem residual suficiente são falhas declaradas. Uma extremidade que zera f é retornada imediatamente.

## Newton-Raphson

xᵢ₊₁ = xᵢ − f(xᵢ)/dᵢ, com derivada aproximada:

dᵢ = [f(xᵢ+h) − f(xᵢ−h)] / (2h), h = ∛ε · max(1,|xᵢ|), ε = Number.EPSILON.

A derivada é **numérica**, não simbólica. Parada: f(x) = 0, ou |xᵢ₊₁−xᵢ| ≤ tolerância · max(1,|xᵢ₊₁|) e residual ≤ tolerância. Derivada absoluta menor que 10⁻¹⁴, saída do domínio, divergência, estagnação ou limite de iterações resultam em estado sem convergência.

## Secante

xᵢ₊₁ = xᵢ − f(xᵢ)(xᵢ−xᵢ₋₁) / [f(xᵢ)−f(xᵢ₋₁)]. Usa o mesmo critério de passo e residual de Newton. Diferença de valores da função muito pequena interrompe o método. Não há garantia de convergência para qualquer escolha inicial.

## Integração composta

h = (b−a)/n, xᵢ = a+ih.

- Trapézios: I ≈ h/2 · [f(a) + 2Σᵢ₌₁ⁿ⁻¹ f(xᵢ) + f(b)].
- Simpson 1/3: I ≈ h/3 · [f(a) + 4Σᵢ ímpar f(xᵢ) + 2Σᵢ par interior f(xᵢ) + f(b)], com n par.

A implementação usa soma compensada de Kahan. As fórmulas requerem regularidade da função; a tela não fornece erro certificado nem resolve integrais impróprias. Exemplo: integral de x² de 0 a 1 = 1/3; Simpson reproduz esse valor até o arredondamento de ponto flutuante.

## Precisão e interpretação

O sinal ≈ identifica aproximações numéricas e resultados arredondados na exibição. O passo |xᵢ−xᵢ₋₁| e a semilargura não devem ser chamados de erro verdadeiro da raiz quando ela é desconhecida. Residual pequeno também não é, sozinho, um certificado de proximidade a uma raiz. BigInt é exato para os inteiros combinatórios dentro dos limites de entrada.
