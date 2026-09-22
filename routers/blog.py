from fastapi import APIRouter, HTTPException, Query
from typing import Literal
import logging

router = APIRouter()

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# "Banco de dados" estático em memória
ARTIGOS = [
    {
        "slug": "reserva-de-emergencia",
        "titulo": "Como Construir sua Reserva de Emergência do Zero",
        "resumo": "Aprenda a criar uma reserva de emergência sólida que protegerá suas finanças em momentos de crise. Descubra quanto guardar, onde investir e como manter a disciplina.",
        "conteudo": """# Como Construir sua Reserva de Emergência do Zero

A reserva de emergência é a **base de qualquer planejamento financeiro sólido**. Ela funciona como um colchão de segurança para imprevistos como perda de emprego, despesas médicas urgentes ou reparos inesperados.

## Por que você PRECISA de uma reserva?

Imagine perder seu emprego hoje. Quanto tempo você conseguiria manter suas despesas sem entrar em pânico? A reserva de emergência existe exatamente para te dar **tempo e tranquilidade** para resolver situações críticas sem precisar recorrer a empréstimos caros ou vender investimentos no momento errado.

### Estatísticas preocupantes:
- 58% dos brasileiros não têm reserva de emergência (SPC Brasil, 2025)
- Quem não tem reserva recorre a cheque especial (juros de até 15% ao mês!)
- Uma emergência pode destruir anos de economia em poucos meses

## Quanto guardar?

A regra geral recomenda **de 6 a 12 meses das suas despesas mensais**. Mas isso varia conforme seu perfil:

- **6 meses**: Se você tem emprego estável (CLT), mora com os pais ou tem múltiplas fontes de renda.
- **12 meses**: Se você é autônomo, tem renda variável ou possui dependentes.
- **3 meses**: Para quem está começando do zero (meta inicial).

### Exemplo prático:
Se suas despesas mensais são R$ 3.000, você precisa de:
- **Mínimo (6 meses)**: R$ 18.000
- **Ideal (12 meses)**: R$ 36.000

## Onde investir a reserva?

A reserva de emergência **NÃO É INVESTIMENTO**. O objetivo não é rentabilidade, mas **liquidez imediata** e **segurança total**. Opções ideais:

1. **Tesouro Selic**: Rentabilidade próxima da taxa Selic (atualmente ~11% ao ano). Liquidez D+0 (dinheiro no mesmo dia).
2. **CDB com Liquidez Diária**: Prefira bancos grandes (cobertura do FGC). Rendimento de ~100% do CDI.
3. **Conta remunerada (Nubank, PicPay)**: Rentabilidade menor (~100% do CDI), mas saque instantâneo.

**EVITE**:
- ❌ Ações (volatilidade alta)
- ❌ Fundos imobiliários (pode demorar para vender)
- ❌ CDB sem liquidez (dinheiro travado)
- ❌ Poupança (rendimento baixo: 0,5% ao mês)

## Passo a passo para criar sua reserva

### 1. Calcule suas despesas reais
Liste TUDO que você gasta por mês:
- Aluguel, condomínio, IPTU
- Alimentação, transporte
- Contas (luz, água, internet)
- Lazer e extras

**Dica**: Use apps como Organizze ou Mobills por 3 meses para ter certeza do valor real.

### 2. Defina sua meta inicial
Comece com **3 meses de despesas**. É uma meta alcançável e já te dá segurança para pequenos imprevistos.

### 3. Automatize os aportes
Configure transferência automática no dia do salário. Trate a reserva como uma conta obrigatória.

**Exemplo**:
- Salário: R$ 4.000
- Despesas: R$ 3.000
- Sobra: R$ 1.000
- Reserva automática: **R$ 500/mês** (50% da sobra)

Em 36 meses você terá R$ 18.000 guardados!

### 4. Nunca toque (a menos que seja REALMENTE emergência)
**Emergência** = Situação imprevista e urgente que afeta sua sobrevivência financeira.

**NÃO é emergência**:
- Black Friday
- Viagem de férias
- Troca de celular

## Mantendo a disciplina

A parte mais difícil é não usar a reserva para "emergências" que não são reais. Algumas dicas:

1. **Mantenha em conta separada**: Não deixe no mesmo banco da conta corrente.
2. **Visualize o progresso**: Use planilhas ou apps para acompanhar a evolução.
3. **Celebre marcos**: Chegou em 3 meses? Comemore (sem gastar a reserva 😄).

## Conclusão

A reserva de emergência é o **primeiro passo** antes de qualquer outro investimento. Sem ela, você está construindo um castelo na areia. Comece hoje, mesmo que seja com R$ 100. O importante é dar o primeiro passo!

**Próximos passos**:
- Calcule suas despesas mensais reais
- Abra uma conta no Tesouro Direto (site do governo)
- Configure aportes automáticos de pelo menos 10% do seu salário

Sua paz de espírito no futuro agradecerá! 💙
""",
        "tags": ["Iniciante", "Reserva de Emergência", "Educação Financeira"],
        "data": "10/01/2026",
        "imagem_capa": "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&h=600&fit=crop"
    },
    {
        "slug": "juros-compostos-magia",
        "titulo": "A Mágica dos Juros Compostos: Como Transformar R$ 100 em Milhões",
        "resumo": "Entenda por que Einstein chamou os juros compostos de 'oitava maravilha do mundo' e como você pode usar esse poder a seu favor para construir riqueza a longo prazo.",
        "conteudo": """# A Mágica dos Juros Compostos

Albert Einstein teria dito que os juros compostos são *"a força mais poderosa do universo"* e *"a oitava maravilha do mundo"*. E ele estava absolutamente certo.

## O que são juros compostos?

Diferente dos juros simples (calculados apenas sobre o valor inicial), os **juros compostos são calculados sobre o montante acumulado** — ou seja, você ganha juros sobre os juros.

### Exemplo visual:

**Juros Simples** (R$ 1.000 a 10% ao ano por 3 anos):
- Ano 1: R$ 1.000 + R$ 100 = R$ 1.100
- Ano 2: R$ 1.100 + R$ 100 = R$ 1.200
- Ano 3: R$ 1.200 + R$ 100 = **R$ 1.300**

**Juros Compostos** (R$ 1.000 a 10% ao ano por 3 anos):
- Ano 1: R$ 1.000 + R$ 100 = R$ 1.100
- Ano 2: R$ 1.100 + R$ 110 = R$ 1.210
- Ano 3: R$ 1.210 + R$ 121 = **R$ 1.331**

Parece pouco? Vamos ver o impacto no longo prazo...

## O poder do tempo

A verdadeira mágica acontece quando você **mantém seus investimentos por décadas**. Veja o crescimento de R$ 10.000 a 10% ao ano:

| Anos | Valor Acumulado |
|------|-----------------|
| 5    | R$ 16.105       |
| 10   | R$ 25.937       |
| 20   | R$ 67.275       |
| 30   | R$ 174.494      |
| 40   | R$ 452.593      |

**45x o valor inicial em 40 anos!** 🚀

## A regra dos 72

Quer saber em quanto tempo seu dinheiro vai dobrar? Use a **Regra dos 72**:

```
Tempo para dobrar = 72 ÷ Taxa de juros anual
```

Exemplos:
- A 6% ao ano: 72 ÷ 6 = **12 anos**
- A 10% ao ano: 72 ÷ 10 = **7,2 anos**
- A 12% ao ano: 72 ÷ 12 = **6 anos**

## Quanto mais cedo, melhor

Vamos comparar dois investidores:

### João (começou aos 20 anos):
- Investiu R$ 500/mês dos 20 aos 30 anos
- Parou de aportar após 10 anos
- Total investido: R$ 60.000
- Aos 60 anos: **R$ 1.897.224**

### Maria (começou aos 30 anos):
- Investiu R$ 500/mês dos 30 aos 60 anos
- Investiu por 30 anos
- Total investido: R$ 180.000
- Aos 60 anos: **R$ 1.356.263**

**João investiu 3x MENOS dinheiro, mas terminou com MAIS riqueza!** Isso é o poder de começar cedo.

## Aportes mensais fazem TODA a diferença

Não precisa começar com muito. Veja o impacto de aportes constantes:

**Cenário**: Investir mensalmente por 30 anos a 10% ao ano (CDI médio histórico)

| Aporte Mensal | Valor Final       |
|---------------|-------------------|
| R$ 100        | R$ 226.048        |
| R$ 300        | R$ 678.146        |
| R$ 500        | R$ 1.130.244      |
| R$ 1.000      | R$ 2.260.487      |

Com apenas **R$ 300/mês** (o preço de um jantar por semana), você pode ter quase **R$ 700 mil** em 30 anos!

## Como usar os juros compostos a seu favor

### 1. Comece HOJE
Não espere ter "mais dinheiro". Cada mês que você adia custa caro. Comece com R$ 50, R$ 100, o que for possível.

### 2. Seja consistente
Aportes regulares (mesmo que pequenos) são mais poderosos que aportes grandes esporádicos.

### 3. Reinvista os rendimentos
NUNCA retire os lucros. Deixe o dinheiro trabalhando para você. É assim que a bola de neve cresce.

### 4. Aumente os aportes com o tempo
Ganhou aumento? Recebeu bônus? Aumente os aportes. Seu eu futuro agradecerá.

### 5. Pense em décadas, não em meses
Volatilidade de curto prazo não importa. O que importa é o crescimento exponencial no longo prazo.

## Onde investir para aproveitar os juros compostos?

As melhores opções para o longo prazo:

1. **Tesouro IPCA+**: Renda fixa que protege contra inflação + juros reais.
2. **Fundos de Índice (ETFs)**: Diversificação automática no mercado de ações.
3. **Fundos Imobiliários**: Rendimentos mensais que podem ser reinvestidos.
4. **Previdência Privada (PGBL/VGBL)**: Vantagens fiscais para prazos longos.

## O lado sombrio: juros compostos contra você

Os juros compostos também trabalham **contra você** quando você tem dívidas!

Uma dívida de **R$ 1.000 no cartão de crédito** (13% ao mês):
- Após 3 meses: R$ 1.443
- Após 6 meses: R$ 2.082
- Após 12 meses: R$ 4.334

**Nunca deixe dívidas acumularem!** Pague primeiro, invista depois.

## Conclusão

Os juros compostos são a ferramenta mais poderosa para construir riqueza, mas exigem duas coisas:
1. **Tempo** (quanto mais, melhor)
2. **Disciplina** (aportes constantes e paciência)

Não existe fórmula mágica ou atalho. Mas existe uma verdade absoluta: **quem começa cedo e investe com consistência fica rico**.

Você tem duas opções:
- ✅ Deixar o tempo trabalhar A SEU FAVOR
- ❌ Deixar o tempo trabalhar CONTRA VOCÊ (inflação, dívidas)

**Comece hoje. Use nossa calculadora de juros compostos no menu "Calculadoras" e veja o que é possível!** 💰
""",
        "tags": ["Investimentos", "Iniciante", "Juros Compostos"],
        "data": "08/01/2026",
        "imagem_capa": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=600&fit=crop"
    },
    {
        "slug": "tesouro-direto-guia-completo",
        "titulo": "Tesouro Direto: O Guia Definitivo para Iniciantes",
        "resumo": "Tudo que você precisa saber para começar a investir em títulos públicos. Segurança máxima, liquidez e rentabilidade superior à poupança.",
        "conteudo": """# Tesouro Direto: O Guia Definitivo

O **Tesouro Direto** é a porta de entrada ideal para quem quer sair da poupança e começar a investir de verdade. É seguro, simples e acessível (você pode começar com apenas R$ 30!).

## O que é o Tesouro Direto?

É um programa do governo federal que permite que **pessoas físicas comprem títulos públicos** diretamente pela internet. Quando você investe no Tesouro, está essencialmente emprestando dinheiro para o governo, que te devolve com juros.

### Por que é tão seguro?

É o investimento **MAIS SEGURO DO BRASIL**. Você só perderia dinheiro se o governo brasileiro quebrasse — o que é extremamente improvável (e se isso acontecer, até os bancos quebrariam antes).

- **Garantia**: República Federativa do Brasil
- **Cobertura**: Não precisa de FGC (já é o próprio governo)
- **Risco**: Praticamente zero (menor risco de todo o mercado)

## Tipos de Títulos do Tesouro

Existem 3 famílias principais:

### 1. Tesouro Selic (LFT)

**Para que serve**: Reserva de emergência, objetivos de curto prazo (menos de 2 anos).

**Como funciona**:
- Acompanha a taxa Selic (atual: ~11,25% ao ano)
- **Liquidez diária**: Você pode resgatar a qualquer momento sem perder dinheiro
- Não tem risco de marcação a mercado (preço não oscila)

**Exemplo prático**:
- Investiu: R$ 10.000
- Taxa Selic: 11% ao ano
- Após 1 ano: R$ 11.100 (descontando impostos e taxas)

**Ideal para**:
- Reserva de emergência
- Guardar dinheiro que você pode precisar a qualquer momento

### 2. Tesouro IPCA+ (NTN-B Principal)

**Para que serve**: Investimentos de longo prazo (aposentadoria, faculdade dos filhos, compra de imóvel).

**Como funciona**:
- Rende **IPCA + uma taxa fixa** (ex: IPCA + 6% ao ano)
- Protege seu poder de compra contra a inflação
- Tem marcação a mercado (preço oscila antes do vencimento)

**Exemplo prático**:
- Título: Tesouro IPCA+ 2045 (IPCA + 6,18%)
- Inflação do ano: 4%
- Rendimento real: 6,18%
- **Rendimento total: 10,18% ao ano** 🔥

**Ideal para**:
- Aposentadoria
- Objetivos de 10+ anos
- Quem quer ganhar da inflação

### 3. Tesouro Prefixado (LTN)

**Para que serve**: Quando você acha que os juros vão cair no futuro.

**Como funciona**:
- Taxa fixa definida na compra (ex: 11,5% ao ano)
- Você já sabe EXATAMENTE quanto vai receber no vencimento
- Também tem marcação a mercado

**Exemplo prático**:
- Título: Tesouro Prefixado 2029 (11,5% ao ano)
- Investiu: R$ 10.000
- Em 2029 você recebe: **R$ 18.104** (sem aportes)

**Ideal para**:
- Quem acredita que a Selic vai cair
- Objetivos com data definida (casamento, viagem)

## Comparação com a Poupança

| Característica      | Poupança        | Tesouro Selic   |
|---------------------|-----------------|-----------------|
| Rentabilidade       | 0,5% ao mês (~6,17% ao ano) | ~11% ao ano (acompanha Selic) |
| Liquidez            | Imediata        | D+1 (1 dia útil) |
| Imposto de Renda    | Isento          | 15% a 22,5% (tabela regressiva) |
| Segurança           | Até R$ 250k (FGC) | Ilimitada (governo federal) |

**Veredito**: Mesmo pagando IR, o Tesouro Selic rende **MUITO MAIS** que a poupança.

## Como começar a investir

### Passo 1: Abra conta em uma corretora

Recomendações (não cobram taxa de custódia):
- Clear
- Rico
- XP Investimentos
- BTG Pactual Digital

**Dica**: Evite corretoras que cobram taxa de custódia (geralmente bancos tradicionais).

### Passo 2: Transfira dinheiro para a corretora

Via TED ou PIX da sua conta bancária.

### Passo 3: Acesse o Tesouro Direto

Dentro da plataforma da corretora, procure por "Tesouro Direto".

### Passo 4: Escolha o título ideal

Para começar:
- **Reserva de emergência**: Tesouro Selic
- **Aposentadoria (10+ anos)**: Tesouro IPCA+ com vencimento longo
- **Objetivo de médio prazo**: Tesouro Prefixado

### Passo 5: Compre!

Valor mínimo: R$ 30. Sim, você pode começar com apenas trinta reais!

## Custos envolvidos

1. **Taxa da B3 (Bolsa)**: 0,20% ao ano sobre o valor investido
2. **Imposto de Renda**: Tabela regressiva
   - Até 180 dias: 22,5%
   - 181 a 360 dias: 20%
   - 361 a 720 dias: 17,5%
   - Acima de 720 dias: 15%
3. **Taxa da corretora**: R$ 0 (escolha corretoras que isentam)

**Importante**: O IR só incide sobre o LUCRO, não sobre o valor total.

## Marcação a Mercado: O que você PRECISA saber

Os títulos Prefixados e IPCA+ têm seus preços ajustados diariamente conforme as expectativas do mercado.

**Na prática**:
- Se você segurar até o vencimento: **recebe exatamente o que foi prometido**
- Se vender antes: pode ganhar mais OU menos, dependendo do momento

**Exemplo real**:
- Comprou Tesouro IPCA+ 2035 em 2020 por R$ 10.000
- Em 2023, o título valia R$ 8.500 (marcação negativa)
- Se vendeu: perdeu R$ 1.500
- Se manteve até 2035: receberá os R$ 10.000 + juros conforme contratado

**Regra de ouro**: Se o título é para longo prazo, NUNCA venda antes do vencimento por causa de oscilações.

## Estratégias avançadas

### 1. Diversificação por vencimento

Não coloque tudo no mesmo vencimento:
- 30% em Tesouro Selic (liquidez)
- 40% em Tesouro IPCA+ 2035 (médio prazo)
- 30% em Tesouro IPCA+ 2045 (longo prazo)

### 2. Aportes mensais automatizados

Configure aportes recorrentes na corretora. Assim você aproveita a média de preços ao longo do tempo.

### 3. Escada de vencimentos

Compre títulos com vencimentos escalonados (2030, 2035, 2040, 2045). Assim você terá liquidez periódica sem vender antes do prazo.

## Perguntas frequentes

**Q: É melhor que CDB?**
A: Depende. CDBs de bancos grandes rendem parecido (100-110% do CDI). Já CDBs de bancos menores podem render mais (130% do CDI), mas têm limite de garantia do FGC (R$ 250k).

**Q: Posso perder dinheiro?**
A: Só se você vender títulos Prefixados ou IPCA+ antes do vencimento em momento desfavorável. No Tesouro Selic isso não acontece.

**Q: Quanto rende R$ 10.000 no Tesouro Selic?**
A: Com Selic a 11% ao ano, após 1 ano você terá aproximadamente R$ 10.870 (já descontando IR de 17,5%).

**Q: Preciso declarar no Imposto de Renda?**
A: Sim, mas é simples. A corretora gera um informe automático com todos os dados.

## Conclusão

O Tesouro Direto é perfeito para:
- ✅ Quem quer sair da poupança
- ✅ Iniciantes em investimentos
- ✅ Reserva de emergência (Tesouro Selic)
- ✅ Objetivos de longo prazo (Tesouro IPCA+)

**Não é ideal para**:
- ❌ Quem precisa de liquidez imediata (use conta remunerada)
- ❌ Quem busca ganhos muito altos no curto prazo (tem risco menor = retorno menor)

**Próximo passo**: Abra conta em uma corretora HOJE e compre seu primeiro título. Comece com R$ 100 no Tesouro Selic. Você vai ver como é simples e seguro!

**Dica final**: Use nossa calculadora de Renda Fixa no menu "Calculadoras" para simular seus ganhos! 📊
""",
        "tags": ["Investimentos", "Tesouro Direto", "Renda Fixa"],
        "data": "05/01/2026",
        "imagem_capa": "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&h=600&fit=crop"
    }
]


LEGACY_ARTICLES = ARTIGOS[1:]


GUIDANCE_ARTICLES = {
    "reserva-de-emergencia": {
        "data": "10/01/2026",
        "imagem_capa": "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&h=600&fit=crop",
        "localizations": {
            "pt-BR": {"titulo": "Reserva de emergência: como usar uma meta de cobertura", "resumo": "Uma referência para entender cobertura de despesas, aportes recorrentes e os limites do Planejador de Reserva.", "tags": ["Reserva de Emergência", "Planejamento", "Educação Financeira"], "conteudo": """# Reserva de emergência: como usar uma meta de cobertura

Uma reserva de emergência é um valor separado para lidar com despesas inesperadas ou perda temporária de renda. Ela pode reduzir a necessidade de recorrer a crédito em um momento de pressão, mas não elimina todos os riscos financeiros.

## Comece pelas despesas essenciais

Despesas essenciais mensais são uma base útil porque representam o custo de manter a vida cotidiana. Multiplicar esse valor por meses de cobertura cria uma meta de planejamento, não uma regra universal. A duração adequada depende, por exemplo, da estabilidade da renda, de responsabilidades e de outras fontes de apoio. Exemplos de faixas usados em educação financeira são apenas heurísticas; o contexto pessoal importa.

## Onde manter a reserva

Liquidez, acessibilidade, risco e preservação do valor são critérios relevantes. Cada produto financeiro tem condições, riscos, prazos e regras próprias. Compare informações atualizadas e documentação da instituição antes de decidir onde manter recursos destinados a emergências.

## O efeito dos aportes

Aportes recorrentes encurtam o tempo necessário para alcançar uma meta quando permanecem constantes. Esse horizonte deve ser revisto se despesas, renda, valor já reservado ou capacidade de aporte mudarem.

## O que o Planejador de Reserva calcula

No JulisHub, você escolhe despesas essenciais mensais, meses de cobertura, reserva atual e aporte mensal. O planejador deriva a meta, o valor restante, o progresso e uma estimativa de conclusão. A estimativa pressupõe que o aporte informado continua constante.

O cálculo não modela inflação, rendimento de investimentos, mudanças de aporte ou mudanças de despesas. Ele é uma ferramenta educativa de planejamento, não aconselhamento financeiro personalizado."""},
            "en": {"titulo": "Emergency reserve: using a coverage target", "resumo": "A reference for understanding expense coverage, recurring contributions, and the Reserve Planner's limits.", "tags": ["Emergency Reserve", "Planning", "Financial Education"], "conteudo": """# Emergency reserve: using a coverage target

An emergency reserve is money set aside for unexpected expenses or a temporary loss of income. It can reduce the need to use credit under pressure, but it does not remove every financial risk.

## Start with essential expenses

Monthly essential expenses are a useful basis because they represent the cost of maintaining daily life. Multiplying them by coverage months creates a planning target, not a universal rule. A suitable duration depends on income stability, responsibilities, and other support. Ranges used in financial education are heuristics, not prescriptions.

## Where to keep a reserve

Liquidity, accessibility, risk, and preservation of value are relevant criteria. Financial products have their own conditions, risks, terms, and rules. Review current information and the institution's documentation before deciding where to keep emergency resources.

## The effect of recurring contributions

Recurring contributions shorten the time needed to reach a target when they remain constant. Review the plan when expenses, income, the amount already saved, or contribution capacity changes.

## What JulisHub calculates

The JulisHub Reserve Planner uses essential monthly expenses, coverage months, current reserve, and monthly contribution to derive a target, remaining amount, progress, and estimated completion horizon. The estimate assumes the entered contribution remains constant. It does not model inflation, investment returns, changing contributions, or changing expenses. It is an educational planning tool, not personalized financial advice."""},
            "es": {"titulo": "Reserva de emergencia: cómo usar una meta de cobertura", "resumo": "Una referencia para comprender cobertura de gastos, aportes recurrentes y los límites del Planificador de Reserva.", "tags": ["Reserva de Emergencia", "Planificación", "Educación Financiera"], "conteudo": """# Reserva de emergencia: cómo usar una meta de cobertura

Una reserva de emergencia es dinero separado para gastos inesperados o una pérdida temporal de ingresos. Puede reducir la necesidad de usar crédito bajo presión, pero no elimina todos los riesgos financieros.

## Empezá por los gastos esenciales

Los gastos esenciales mensuales son una base útil porque representan el costo de mantener la vida cotidiana. Multiplicarlos por meses de cobertura crea una meta de planificación, no una regla universal. Una duración adecuada depende de la estabilidad de los ingresos, responsabilidades y otros apoyos. Los rangos usados en educación financiera son heurísticas, no prescripciones.

## Dónde mantener la reserva

Liquidez, accesibilidad, riesgo y preservación del valor son criterios relevantes. Los productos financieros tienen condiciones, riesgos, plazos y reglas propias. Revisá información actualizada y la documentación de la institución antes de decidir dónde mantener recursos de emergencia.

## El efecto de los aportes recurrentes

Los aportes recurrentes reducen el tiempo necesario para alcanzar una meta cuando se mantienen constantes. Revisá el plan si cambian los gastos, ingresos, reserva actual o capacidad de aporte.

## Qué calcula JulisHub

El Planificador de Reserva de JulisHub usa gastos esenciales mensuales, meses de cobertura, reserva actual y aporte mensual para derivar meta, monto restante, progreso y horizonte estimado. La estimación supone que el aporte informado permanece constante. No modela inflación, rendimientos, cambios de aportes ni cambios de gastos. Es una herramienta educativa de planificación, no asesoramiento financiero personalizado."""},
        },
    },
    "antecipacao-financiamento": {
        "data": "22/09/2026",
        "imagem_capa": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=600&fit=crop",
        "localizations": {
            "pt-BR": {"titulo": "Antecipação de financiamento: prazo, parcela e juros", "resumo": "Entenda os trade-offs de um pagamento extraordinário em um modelo Price simplificado.", "tags": ["Financiamento", "Antecipação", "Planejamento"], "conteudo": """# Antecipação de financiamento: prazo, parcela e juros

Antecipar um financiamento significa usar um pagamento extraordinário para reduzir o saldo devedor antes do cronograma original. A antecipação pode ser parcial ou total; neste artigo, o foco é uma antecipação parcial em uma simulação educativa.

## Saldo devedor e juros futuros

Em um financiamento com juros, reduzir o principal pendente pode alterar os juros que incidiriam sobre esse saldo no futuro. O momento e o valor de um pagamento extraordinário influenciam a simulação. O valor solicitado pode não ser integralmente aplicado quando ultrapassa o saldo devedor restante.

## Duas consequências no JulisHub

Na comparação do JulisHub, ambas as estratégias aplicam o mesmo pagamento extraordinário ao principal depois da parcela escolhida.

### Reduzir prazo

No modelo simplificado, a prestação regular permanece alinhada ao cronograma original e menos meses podem ser necessários. A última parcela pode diferir. Como o saldo permanece em aberto por menos tempo, o total de juros pode cair.

### Reduzir parcela

No modelo simplificado, o vencimento original é mantido. O principal restante é redistribuído pelos períodos programados restantes, e a prestação regular pode diminuir. A economia de juros pode ser diferente da opção de reduzir prazo.

Nenhuma dessas estratégias é automaticamente a correta. Duração da dívida, fluxo de caixa mensal e juros totais são trade-offs que podem ter importâncias diferentes para cada pessoa.

## Limites da simulação

O JulisHub usa uma taxa fixa e o sistema Price. A simulação não representa data real de liquidação, tarifas contratuais, seguros, tributos, indexação, convenções da instituição ou outros ajustes específicos. Para uma transação real, o demonstrativo e o cálculo de liquidação do credor são a referência aplicável."""},
            "en": {"titulo": "Loan prepayment: term, installment, and interest", "resumo": "Understand the trade-offs of an extra principal payment in a simplified Price-method model.", "tags": ["Financing", "Prepayment", "Planning"], "conteudo": """# Loan prepayment: term, installment, and interest

Prepaying a loan means using an extra payment to reduce outstanding principal before the original schedule. A prepayment can be partial or total; this article focuses on a partial prepayment in an educational simulation.

## Outstanding principal and future interest

In an interest-bearing loan, reducing outstanding principal can change the interest that would apply to that balance in the future. The timing and amount of an extra payment affect the simulation. A requested amount may not be fully applied when it exceeds the remaining balance.

## Two consequences in JulisHub

In JulisHub's comparison, both strategies apply the same extra payment to principal after the selected installment.

### Reduce term

In the simplified model, the regular installment remains aligned with the original schedule and fewer months may be required. The final installment may differ. Because principal remains outstanding for less time, total interest may fall.

### Reduce installment

In the simplified model, the original maturity is retained. Remaining principal is redistributed across the remaining scheduled periods, and the regular installment may decrease. Interest savings may differ from the reduce-term option.

Neither strategy is automatically correct. Debt duration, monthly cash flow, and total interest are trade-offs that can matter differently to each person.

## Simulation limits

JulisHub uses a fixed rate and the Price method. It does not represent an actual settlement date, contractual fees, insurance, taxes, indexation, lender conventions, or other contract-specific adjustments. For a real transaction, the lender's statement and settlement calculation are the applicable reference."""},
            "es": {"titulo": "Pago anticipado de financiamiento: plazo, cuota e intereses", "resumo": "Comprendé los trade-offs de un pago extraordinario al capital en un modelo Price simplificado.", "tags": ["Financiamiento", "Pago anticipado", "Planificación"], "conteudo": """# Pago anticipado de financiamiento: plazo, cuota e intereses

Anticipar un financiamiento significa usar un pago extraordinario para reducir el capital pendiente antes del cronograma original. Puede ser parcial o total; este artículo aborda un pago parcial en una simulación educativa.

## Capital pendiente e intereses futuros

En un financiamiento con intereses, reducir el capital pendiente puede cambiar los intereses que se aplicarían a ese saldo en el futuro. El momento y el monto de un pago extraordinario influyen en la simulación. Un monto solicitado puede no aplicarse completamente si supera el saldo restante.

## Dos consecuencias en JulisHub

En la comparación de JulisHub, ambas estrategias aplican el mismo pago extraordinario al capital después de la cuota elegida.

### Reducir plazo

En el modelo simplificado, la cuota regular permanece alineada con el cronograma original y pueden requerirse menos meses. La cuota final puede diferir. Como el capital permanece pendiente por menos tiempo, el total de intereses puede disminuir.

### Reducir cuota

En el modelo simplificado, se mantiene el vencimiento original. El capital restante se redistribuye entre los períodos programados restantes y la cuota regular puede disminuir. El ahorro de intereses puede diferir de la opción de reducir plazo.

Ninguna estrategia es automáticamente correcta. Duración de la deuda, flujo de caja mensual e intereses totales son trade-offs que pueden importar de manera diferente para cada persona.

## Límites de la simulación

JulisHub usa una tasa fija y el sistema Price. No representa la fecha real de liquidación, cargos contractuales, seguros, impuestos, indexación, convenciones de la entidad u otros ajustes específicos. Para una operación real, el estado y cálculo de liquidación del acreedor son la referencia aplicable."""},
        },
    },
}

SUPPORTED_BLOG_LANGS = ("pt-BR", "en", "es")
BlogLang = Literal["pt-BR", "en", "es"]


def localized_article(slug: str, lang: BlogLang) -> dict | None:
    guidance = GUIDANCE_ARTICLES.get(slug)
    if guidance:
        localized = guidance["localizations"].get(lang)
        if localized is None:
            return None
        return {"slug": slug, "data": guidance["data"], "imagem_capa": guidance["imagem_capa"], **localized}
    legacy = next((article for article in LEGACY_ARTICLES if article["slug"] == slug), None)
    return legacy if legacy is not None and lang == "pt-BR" else None


def localized_articles(lang: BlogLang) -> list[dict]:
    slugs = ["reserva-de-emergencia", "antecipacao-financiamento"] + [article["slug"] for article in LEGACY_ARTICLES]
    return [article for slug in slugs if (article := localized_article(slug, lang)) is not None]


@router.get("/blog")
async def get_artigos(lang: BlogLang = Query("pt-BR")):
    """Returns localized article metadata; legacy articles are PT-BR only."""
    try:
        articles = localized_articles(lang)
        logger.info("Listing %s blog articles for %s", len(articles), lang)
        return [{key: value for key, value in article.items() if key != "conteudo"} for article in articles]
    except Exception as error:
        logger.error("Could not list blog articles: %s", error)
        raise HTTPException(status_code=500, detail="Erro ao carregar artigos")


@router.get("/blog/{slug}")
async def get_artigo(slug: str, lang: BlogLang = Query("pt-BR")):
    """Returns one localized article; unavailable translations never fall back silently."""
    article = localized_article(slug, lang)
    if article is None:
        raise HTTPException(status_code=404, detail=f"Artigo '{slug}' não disponível para {lang}")
    return article
