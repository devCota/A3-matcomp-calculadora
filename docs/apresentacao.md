# Roteiro de demonstração

Prepare Node e dependências antes da apresentação. Execute `npm run dev`, abra http://localhost:5173 e mantenha o terminal aberto. Use uma janela limpa para separar histórico de demonstração. Não há conta ou serviço de cálculo remoto. Alternativamente gere `npm run build` e apresente com `npm run preview`.

1. **Apresente o projeto.** Piratas do Cálculo, UNA, Matemática Computacional, Prof. André Rodrigues. Tema Slowpoke nas cores e curvas; cinco módulos no navegador.
2. **Científica e teclado.** Digite `2+3*4`, Enter: 14. Depois `(2+3)*4`: 20. Mostre Backspace, CE removendo apenas o número atual, e C limpando a expressão. DEG: `sin(30)` ≈ 0,5. RAD: `cos(pi)` ≈ −1. Mencione que o teclado e os botões usam o mesmo motor.
3. **Funções.** Exemplo de parábola `x^2+2x+1`, x = 3: 16. Use “Avaliar e traçar”, aproxime o gráfico e mostre coordenadas. Exemplo `1/x` demonstra a quebra em x = 0. Explique a limitação da amostragem.
4. **Matrizes.** Carregue o exemplo A = [[2,−1],[3,4]], selecione determinante: 11. Depois produto A × B = [[2,3],[3,10]]. Altere uma dimensão para mostrar validação de incompatibilidade.
5. **Combinatória.** C(8,3) = 56, depois exemplo BANANA = 60. Mostre 100! e seus 158 algarismos: BigInt preserva o inteiro completo.
6. **Diferencial numérico.** Bisseção de `x^2−2` em [0,2], tolerância 10⁻⁸: raiz ≈ 1,41421356. Mostre residual, critério de parada e tabela. Compare Newton com x₀ = 1. Exemplo de Simpson, x² entre 0 e 1, 100 subdivisões: ≈ 1/3.
7. **Confiabilidade.** Mostre `1/0`, Simpson com n ímpar ou Newton em `x^2+1` com x₀ = 0. Erros não travam a aplicação; “sem convergência” não é apresentado como sucesso.
8. **Histórico e encerramento.** Abra histórico, reutilize um problema e exporte TXT. Mostre a interface estreita e as preferências. Diga que o build é estático, com hospedagem gratuita preparada; apresente apenas uma URL que tenha sido realmente publicada pelo grupo.

Evite dizer que os métodos são exatos ou sempre convergem. Não apresente o erro de passo como erro verdadeiro. Tenha capturas em `docs/screenshots` como apoio visual; elas não substituem a demonstração dos cálculos.
