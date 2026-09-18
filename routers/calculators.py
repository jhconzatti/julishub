from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter()

# --- 1. Simulador de Juros Compostos (Investimento) ---
class JurosCompostosInput(BaseModel):
    aporte_inicial: float
    aporte_mensal: float
    taxa_anual: float
    anos: int

@router.post("/juros-compostos")
def calcular_juros_compostos(dados: JurosCompostosInput):
    meses = dados.anos * 12
    taxa_mensal = (1 + dados.taxa_anual / 100) ** (1/12) - 1
    
    saldo = dados.aporte_inicial
    total_investido = dados.aporte_inicial
    
    grafico = []
    
    # Adiciona o ponto inicial (mês 0)
    grafico.append({
        "mes": 0,
        "ano": 0,
        "investido": round(total_investido, 2),
        "juros": 0,
        "total": round(saldo, 2)
    })

    for mes in range(1, meses + 1):
        saldo = saldo * (1 + taxa_mensal) + dados.aporte_mensal
        total_investido += dados.aporte_mensal
        
        if mes % 12 == 0:  # Salva pontos anuais para o gráfico não ficar gigante
            grafico.append({
                "mes": mes,
                "ano": mes // 12,
                "investido": round(total_investido, 2),
                "juros": round(saldo - total_investido, 2),
                "total": round(saldo, 2)
            })
            
    return {
        "grafico": grafico,
        "resumo": {
            "total_investido": round(total_investido, 2),
            "total_juros": round(saldo - total_investido, 2),
            "total_final": round(saldo, 2)
        }
    }


# --- 2. Calculadora de Financiamento (Price) ---
class FinanciamentoInput(BaseModel):
    valor_financiamento: float = Field(gt=0, le=1_000_000_000, allow_inf_nan=False)
    taxa_mensal: float = Field(ge=0, le=100, allow_inf_nan=False)
    meses: int = Field(gt=0, le=600)


class FinanciamentoAntecipacaoInput(FinanciamentoInput):
    mes_antecipacao: int = Field(ge=1)
    valor_antecipacao: float = Field(gt=0, le=1_000_000_000, allow_inf_nan=False)


def calcular_prestacao_price(principal: float, taxa_mensal: float, meses: int) -> float:
    """Calcula a prestação Price sem arredondar valores internos."""
    if taxa_mensal == 0:
        return principal / meses
    return principal * (taxa_mensal * (1 + taxa_mensal) ** meses) / ((1 + taxa_mensal) ** meses - 1)


def construir_tabela_price(
    principal: float,
    taxa_mensal: float,
    prestacao: float,
    inicio_mes: int = 1,
    meses_maximos: Optional[int] = None,
) -> list[dict]:
    """Gera a amortização mensal sem arredondar saldo ou juros durante o cálculo."""
    saldo = principal
    tabela = []
    mes = inicio_mes

    while saldo > 1e-8 and (meses_maximos is None or len(tabela) < meses_maximos):
        juros = saldo * taxa_mensal
        pagamento = min(prestacao, saldo + juros)
        amortizacao = pagamento - juros
        saldo = max(saldo - amortizacao, 0.0)
        tabela.append({"mes": mes, "saldo": saldo, "juros": juros, "pagamento": pagamento})
        mes += 1

    return tabela


def totalizar_tabela(tabela: list[dict], valor_antecipacao: float = 0.0) -> tuple[float, float]:
    return (
        sum(item["pagamento"] for item in tabela) + valor_antecipacao,
        sum(item["juros"] for item in tabela),
    )


def criar_evolucao(
    original: list[dict],
    reduzir_prazo: list[dict],
    reduzir_parcela: list[dict],
    mes_antecipacao: int,
) -> list[dict]:
    """Amostra no máximo 150 pontos, preservando início, antecipação e finais."""
    maior_mes = max(
        original[-1]["mes"],
        reduzir_prazo[-1]["mes"],
        reduzir_parcela[-1]["mes"],
    )
    meses = {0, mes_antecipacao, original[-1]["mes"], reduzir_prazo[-1]["mes"], reduzir_parcela[-1]["mes"]}
    intervalos = min(maior_mes, 145)
    meses.update(round(indice * maior_mes / intervalos) for indice in range(intervalos + 1))

    def saldos_por_mes(tabela: list[dict]) -> dict[int, float]:
        return {item["mes"]: item["saldo"] for item in tabela}

    saldos_original = saldos_por_mes(original)
    saldos_prazo = saldos_por_mes(reduzir_prazo)
    saldos_parcela = saldos_por_mes(reduzir_parcela)

    return [
        {
            "mes": mes,
            "original": round(saldos_original.get(mes, 0.0), 2),
            "reduzir_prazo": round(saldos_prazo.get(mes, 0.0), 2),
            "reduzir_parcela": round(saldos_parcela.get(mes, 0.0), 2),
        }
        for mes in sorted(meses)
    ]

@router.post("/financiamento")
def calcular_financiamento(dados: FinanciamentoInput):
    # Fórmula da Tabela Price (PMT)
    pv = dados.valor_financiamento
    i = dados.taxa_mensal / 100
    n = dados.meses
    pmt = calcular_prestacao_price(pv, i, n)
    total_pago = pmt * n
        
    return {
        "valor_prestacao": round(pmt, 2),
        "total_pago": round(total_pago, 2),
        "total_juros": round(total_pago - pv, 2),
        "resumo_texto": f"Em {n} meses, você pagará parcelas de R$ {round(pmt, 2)}."
    }


# --- 3. Calculadora de Salário Líquido (CLT 2026) ---
class SalarioLiquidoInput(BaseModel):
    salario_bruto: float = Field(ge=0, allow_inf_nan=False)
    dependentes: int = Field(default=0, ge=0)
    outros_descontos: float = Field(default=0, ge=0, allow_inf_nan=False)


INSS_2026_BRACKETS = (
    (1621.00, 0.075),
    (2902.84, 0.09),
    (4354.27, 0.12),
    (8475.55, 0.14),
)
IRRF_2026_BRACKETS = (
    (2428.80, 0.0, 0.0),
    (2826.65, 0.075, 182.16),
    (3751.05, 0.15, 394.16),
    (4664.68, 0.225, 675.49),
    (float("inf"), 0.275, 908.73),
)
DEPENDENT_DEDUCTION_2026 = 189.59
SIMPLIFIED_DEDUCTION_2026 = 607.20


def calcular_inss_2026(salario_bruto: float) -> float:
    salario_contribuicao = min(salario_bruto, INSS_2026_BRACKETS[-1][0])
    inss = 0.0
    faixa_anterior = 0.0

    for limite, aliquota in INSS_2026_BRACKETS:
        if salario_contribuicao <= faixa_anterior:
            break
        base_faixa = min(salario_contribuicao, limite) - faixa_anterior
        inss += base_faixa * aliquota
        faixa_anterior = limite

    return inss


def calcular_irrf_2026(salario_bruto: float, inss: float, dependentes: int) -> float:
    deducoes_legais = inss + dependentes * DEPENDENT_DEDUCTION_2026
    deducao_irrf = max(deducoes_legais, SIMPLIFIED_DEDUCTION_2026)
    base_irrf = max(0.0, salario_bruto - deducao_irrf)

    irrf_calculado = 0.0
    for limite, aliquota, parcela_deduzir in IRRF_2026_BRACKETS:
        if base_irrf <= limite:
            irrf_calculado = max(0.0, base_irrf * aliquota - parcela_deduzir)
            break

    if salario_bruto <= 5000.00:
        reducao = min(irrf_calculado, 312.89)
    elif salario_bruto <= 7350.00:
        reducao = min(irrf_calculado, max(0.0, 978.62 - 0.133145 * salario_bruto))
    else:
        reducao = 0.0

    return max(0.0, irrf_calculado - reducao)


@router.post("/salario-liquido")
def calcular_salario_liquido(dados: SalarioLiquidoInput):
    sb = dados.salario_bruto
    inss = round(calcular_inss_2026(sb), 2)
    irrf = round(calcular_irrf_2026(sb, inss, dados.dependentes), 2)
    
    # Resultado Final
    salario_liquido = sb - inss - irrf - dados.outros_descontos
    
    return {
        "salario_bruto": round(sb, 2),
        "inss": round(inss, 2),
        "irrf": round(irrf, 2),
        "outros_descontos": round(dados.outros_descontos, 2),
        "salario_liquido": round(salario_liquido, 2),
        "total_descontos": round(inss + irrf + dados.outros_descontos, 2)
    }


@router.post("/financiamento-antecipacao")
def calcular_financiamento_antecipacao(dados: FinanciamentoAntecipacaoInput):
    """
    Compara antecipação após a parcela selecionada: a parcela desse mês é quitada
    normalmente e só então o valor extraordinário reduz diretamente o saldo.
    """
    if dados.mes_antecipacao >= dados.meses:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="mes_antecipacao deve ser menor que o prazo original")

    taxa = dados.taxa_mensal / 100
    prestacao_original = calcular_prestacao_price(dados.valor_financiamento, taxa, dados.meses)
    tabela_original = construir_tabela_price(dados.valor_financiamento, taxa, prestacao_original)
    total_original, juros_original = totalizar_tabela(tabela_original)

    tabela_antes = construir_tabela_price(
        dados.valor_financiamento,
        taxa,
        prestacao_original,
        meses_maximos=dados.mes_antecipacao,
    )
    saldo_apos_parcela = tabela_antes[-1]["saldo"]
    valor_aplicado = min(dados.valor_antecipacao, saldo_apos_parcela)
    saldo_apos_antecipacao = saldo_apos_parcela - valor_aplicado
    parcelas_restantes = dados.meses - dados.mes_antecipacao

    if saldo_apos_antecipacao <= 1e-8:
        tabela_prazo = tabela_antes
        tabela_parcela = tabela_antes
        total_prazo, juros_prazo = totalizar_tabela(tabela_prazo, valor_aplicado)
        total_parcela, juros_parcela = totalizar_tabela(tabela_parcela, valor_aplicado)
        prazo_resultante = dados.mes_antecipacao
        parcela_recalculada = None
    else:
        tabela_depois_prazo = construir_tabela_price(saldo_apos_antecipacao, taxa, prestacao_original, dados.mes_antecipacao + 1)
        tabela_prazo = tabela_antes + tabela_depois_prazo
        total_prazo, juros_prazo = totalizar_tabela(tabela_prazo, valor_aplicado)
        prazo_resultante = tabela_prazo[-1]["mes"]

        parcela_recalculada = calcular_prestacao_price(saldo_apos_antecipacao, taxa, parcelas_restantes)
        tabela_depois_parcela = construir_tabela_price(
            saldo_apos_antecipacao,
            taxa,
            parcela_recalculada,
            dados.mes_antecipacao + 1,
            parcelas_restantes,
        )
        tabela_parcela = tabela_antes + tabela_depois_parcela
        total_parcela, juros_parcela = totalizar_tabela(tabela_parcela, valor_aplicado)

    return {
        "original": {
            "prestacao": round(prestacao_original, 2),
            "prazo": dados.meses,
            "total_pago": round(total_original, 2),
            "total_juros": round(juros_original, 2),
        },
        "antecipacao": {
            "mes": dados.mes_antecipacao,
            "valor_solicitado": round(dados.valor_antecipacao, 2),
            "valor_aplicado": round(valor_aplicado, 2),
        },
        "reduzir_prazo": {
            "prestacao_regular": round(prestacao_original, 2),
            "prestacao_final": round(tabela_prazo[-1]["pagamento"], 2),
            "prazo": prazo_resultante,
            "meses_economizados": dados.meses - prazo_resultante,
            "total_pago": round(total_prazo, 2),
            "total_juros": round(juros_prazo, 2),
            "juros_economizados": round(juros_original - juros_prazo, 2),
            "quitado": saldo_apos_antecipacao <= 1e-8,
        },
        "reduzir_parcela": {
            "prestacao_original": round(prestacao_original, 2),
            "prestacao_recalculada": round(parcela_recalculada, 2) if parcela_recalculada is not None else None,
            "reducao_prestacao": round(prestacao_original - parcela_recalculada, 2) if parcela_recalculada is not None else None,
            "prazo": dados.mes_antecipacao if saldo_apos_antecipacao <= 1e-8 else dados.meses,
            "parcelas_restantes": 0 if saldo_apos_antecipacao <= 1e-8 else parcelas_restantes,
            "total_pago": round(total_parcela, 2),
            "total_juros": round(juros_parcela, 2),
            "juros_economizados": round(juros_original - juros_parcela, 2),
            "quitado": saldo_apos_antecipacao <= 1e-8,
        },
        "evolucao": criar_evolucao(tabela_original, tabela_prazo, tabela_parcela, dados.mes_antecipacao),
    }
