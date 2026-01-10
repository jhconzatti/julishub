from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
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


@router.get("/blog")
async def get_artigos():
    """
    Retorna lista de todos os artigos (sem o campo 'conteudo' para otimizar performance).
    Ideal para a listagem do blog.
    """
    try:
        logger.info(f"📚 Listando {len(ARTIGOS)} artigos do blog")
        
        # Remove o campo 'conteudo' para deixar a resposta mais leve
        artigos_resumo = [
            {k: v for k, v in artigo.items() if k != 'conteudo'}
            for artigo in ARTIGOS
        ]
        
        return artigos_resumo
    
    except Exception as e:
        logger.error(f"❌ Erro ao listar artigos: {e}")
        raise HTTPException(status_code=500, detail="Erro ao carregar artigos")


@router.get("/blog/{slug}")
async def get_artigo(slug: str):
    """
    Retorna um artigo completo (incluindo conteúdo em Markdown) pelo slug.
    """
    try:
        logger.info(f"📖 Buscando artigo: {slug}")
        
        # Busca o artigo pelo slug
        artigo = next((a for a in ARTIGOS if a["slug"] == slug), None)
        
        if not artigo:
            logger.warning(f"⚠️ Artigo não encontrado: {slug}")
            raise HTTPException(status_code=404, detail=f"Artigo '{slug}' não encontrado")
        
        logger.info(f"✅ Artigo encontrado: {artigo['titulo']}")
        return artigo
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao buscar artigo '{slug}': {e}")
        raise HTTPException(status_code=500, detail="Erro ao carregar artigo")
