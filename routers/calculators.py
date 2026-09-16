from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Dict, Any

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
    valor_financiamento: float
    taxa_mensal: float
    meses: int

@router.post("/financiamento")
def calcular_financiamento(dados: FinanciamentoInput):
    # Fórmula da Tabela Price (PMT)
    pv = dados.valor_financiamento
    i = dados.taxa_mensal / 100
    n = dados.meses
    
    if i == 0: # Evita divisão por zero
        pmt = pv / n
        total_pago = pv
    else:
        pmt = pv * (i * (1 + i)**n) / ((1 + i)**n - 1)
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
