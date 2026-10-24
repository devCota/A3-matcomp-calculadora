# Módulos e comportamento

## Científica

A expressão é editável e o teclado físico usa as mesmas ações dos botões. `C` limpa toda a expressão e zera o visor; `CE` remove a seleção ou o literal numérico antes do cursor. Backspace remove seleção ou caractere anterior. Depois de um cálculo, um número inicia outra expressão; um operador encadeia com Ans. Letras permitem funções completas.

Funções: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sinh`, `cosh`, `tanh`, `sqrt`, `nthRoot`, `log`, `log10`, `ln`, `exp`, `abs`, `factorial`, `round`, `floor`, `ceil`, `mod`, `pow`. Constantes: `pi`, `e`, `Ans`; no módulo de funções e métodos também `x`. Aliases `sen`, `senh`, `arcsen`, `arccos`, `arctan`, `raiz`; símbolos π, ×, ÷, −, ² e ³ são normalizados.

DEG/RAD afeta trigonométricas e inversas; hiperbólicas não dependem de unidade angular. `log(x)` é base 10. Ponto e vírgula separa argumentos. Uma vírgula entre algarismos é decimal. `0^0` é rejeitado por convenção explícita; índices de raiz entre 1 e 1000; expoentes entre −10000 e 10000. Funções exponenciais/hiperbólicas limitam argumento a módulo 1000. Resultados devem ser finitos, com expoente decimal absoluto até 20000.

Memória por sessão: MC limpa, MR insere, MS armazena, M+/M− acumulam a expressão calculada. Cópia preserva o valor interno em notação decimal com ponto.

## Funções

Avalia f(x) no ponto informado e amostra o intervalo com 701 pontos. Pode comparar g(x). O gráfico permite zoom, arrasto e inspeção de coordenadas. Intervalo crescente de amplitude até 1 milhão. Pontos inválidos recebem quebras; descontinuidades são tratadas por heurística de salto e ponto médio, sem garantia analítica. Valores com módulo acima de 10¹² são omitidos no gráfico.

## Matrizes

Grades A/B redimensionáveis de 1 a 8 por dimensão, com valores finitos. Soma/subtração exigem dimensões iguais; produto exige colunas(A) = linhas(B); determinante, inversa, traço e potência exigem A quadrada. Escalar, transposta e operações unárias usam A; B é ignorada nessas operações. Potência inteira entre 0 e 20. Identidade em A assume a quantidade de linhas corrente e torna a matriz quadrada.

Determinante: eliminação com pivotamento parcial. Inversa: Gauss-Jordan com teste de pivô relativo à escala. Operações em ponto flutuante podem perder precisão em matrizes mal condicionadas. Resultado matricial pode ser copiado como TSV.

## Combinatória

Inteiros não negativos até 5000, com k ≤ n em arranjo/combinação simples. Permutação com repetição exige grupos positivos cuja soma seja n. CR exige n+k−1 ≤ 5000 quando n ≥ 1; para n = 0, CR(0,0) = 1 e CR(0,k>0) = 0. Resultados completos com BigInt, inclusive além dos inteiros seguros de JavaScript.

## Cálculo numérico

Bisseção, Newton-Raphson, secante, trapézios e Simpson. Limites/valores iniciais reais com módulo até 10¹²; tolerância de 10⁻¹² a 0,1; 1 a 500 iterações. Integração de 2 a 10000 subdivisões, pares em Simpson. Tabela mostra semilargura na bisseção e variação entre aproximações nos demais. Residual é |f(x)|, sem promessa de erro verdadeiro. Derivada de Newton é diferença central documentada. Fatorial no modo Number é limitado a 170 para evitar overflow.

## Histórico, preferências e temas

Até 100 registros com módulo, expressão/descrição, representação do resultado, data/hora e parâmetros de reprodução. O usuário pode copiar, excluir, confirmar limpeza total, exportar TXT ou reutilizar. A expressão é restaurada; calcular continua sendo uma ação explícita. Preferências: DEG/RAD, 6/10/12/16 algarismos ou casas conforme notação, automática/fixa/científica e tema claro/escuro. Campos e mensagens em português. Memória da científica não é persistida.
