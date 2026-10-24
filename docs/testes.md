# Testes e verificação

Validação realizada em **24/10/2026**, Linux, Node 26.10.0 e Chromium headless. Comandos executados no diretório final `A3-matcomp-calculadora`.

## Testes matemáticos e de edição

```bash
npm test
```

Resultado: **106 testes aprovados**, em três arquivos Vitest.

| Área                | Casos verificados                                                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Científica          | 2+3, precedência, parênteses, raiz, ln(e), 0!, porcentagem, logaritmo com base, raiz ímpar negativa, módulo, potência negativa e notação científica.                                                     |
| Trigonometria       | sin(30°), asin(0,5) em graus, cos(π) e atan(1) em radianos; hiperbólicas e exp.                                                                                                                          |
| Precisão            | 0,1+0,2 = 0,3; literais acima da precisão de Number preservados; cancelamento de grande magnitude marcado aproximado.                                                                                    |
| Segurança e domínio | Divisão por zero, raiz negativa, log inválido, fatorial fracionário/negativo, tangente indefinida, expressões incompletas, propriedades, atribuições, strings, listas, funções não permitidas e limites. |
| Funções             | x²+2x+1 em x=3 retorna 16; multiplicação implícita e variável x restrita aos módulos adequados.                                                                                                          |
| Matrizes            | Soma, subtração, escalar, produto, determinante 11, troca de pivô, singularidade, inversa, transposta, potência zero e dimensões incompatíveis.                                                          |
| Combinatória        | 0!, 5!, 25! exato, C(100,50) exato, BANANA, arranjo, combinação com repetição e parâmetros inválidos.                                                                                                    |
| Numérico            | Bisseção, Newton e secante para √2; trapézios e Simpson para ∫₀¹x²; extremos, sinal inadequado, limite de iterações, polo e derivada nula.                                                               |
| Gráficos            | Quebra de 1/x, polo de tangente entre amostras e preservação de reta íngreme contínua.                                                                                                                   |
| CE                  | Literal corrente, seleção, expoente científico, edição no meio da expressão e operador sem número a apagar.                                                                                              |

Casos aproximados usam tolerâncias, sem depender de igualdade binária exata. Inteiros BigInt são comparados exatamente.

## Jornadas de navegador

```bash
npx playwright install chromium
npm run test:e2e
```

Resultado: **8 verificações aprovadas**:

1. Rótulos, semântica e contraste automático dos cinco módulos em ambos os temas, com axe-core WCAG A/AA e 2.1 AA.
2. Científica, precedência, parênteses, teclado numérico com eventos de Num Lock ativo, decimal, CE/Backspace/C, Ans, DEG/RAD e persistência do histórico após recarga.
3. Uma jornada em cada módulo: f(3)=16 e gráfico, determinante/produto, C(8,3)=56, BANANA=60, 100! completo, bisseção e Simpson com validação de n par.
4. Ausência de conflitos de teclado nos formulários e diálogos, preferências persistidas, tema e erro de domínio.
5. Módulos em 320 e 390 px sem overflow horizontal do documento.
6. Memória MS/M+/M−/MR/MC, cópia real para área de transferência, exportação TXT, reutilização, exclusão e confirmação de limpeza do histórico.
7. Regressões da revisão: resposta indisponível após erro, Ans preservado, aproximação preservada entre módulos, grades 2×2 sem corte interno em 320/390 px, aba ativa visível, tabela com foco/ajuda de rolagem e contagem zero para raiz em extremidade.

Auditoria automática é uma verificação parcial; não substitui avaliação com leitor de tela ou pessoas com deficiência. A inspeção visual revisa também cortes internos que não aumentam a largura do documento.

8. Divisões exatas e raízes perfeitas sem `≈`; dízimas e arredondamentos de exibição continuam aproximados. A verificação de exatidão usa coeficientes decimais BigInt, evitando que uma multiplicação arredondada seja confundida com uma prova.

## Build e tipos

```bash
npm run lint
npm run build
npm run preview
```

Tipos TypeScript e build de produção aprovados. Dependências instaladas com `npm ci`; auditoria npm durante a instalação sem vulnerabilidades conhecidas naquele momento. O Vite informa chunks de matemática/gráficos acima de 500 kB sem compressão; gráficos são carregados sob demanda. Esse aviso não representa falha do build e não foi escondido aumentando artificialmente o limite.

## Verificação visual

Capturas reais em desktop 1440 px e mobile 390/320 px, além de verificação dimensional em 768 px. Estados incluem resultado, erro, histórico, preferências, funções avançadas e tema escuro. O detector Impeccable retornou zero achados. O revisor independente avaliou 16 capturas e confirmou como resolvidas as seis correções apontadas, com disposição `ship` restrita a essa rodada: estado de resultado inválido, grade móvel, navegação visível, seleção/igualdade, residual e tabela acessível. Essa revisão visual não é uma certificação dos algoritmos matemáticos.

## Limites da verificação

Windows/macOS, Safari/Firefox, leitor de tela, touchscreen físico e publicação remota não foram executados nesta máquina. A configuração é estática e portátil, mas esses ambientes permanecem como validação manual recomendada ao grupo. Não há testes contra serviços externos porque a aplicação não usa backend.
