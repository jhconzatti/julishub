from fastapi import APIRouter
from pydantic import BaseModel
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


# --- 3. Calculadora de Salário Líquido (CLT 2024) ---
class SalarioLiquidoInput(BaseModel):
    salario_bruto: float
    dependentes: int = 0
    outros_descontos: float = 0

@router.post("/salario-liquido")
def calcular_salario_liquido(dados: SalarioLiquidoInput):
    sb = dados.salario_bruto
    
    # A. Cálculo INSS (Tabela Progressiva 2024)
    # Teto do salário de contribuição: R$ 7.786,02
    teto_inss = 7786.02
    faixas_inss = [
        (1412.00, 0.075),
        (2666.68, 0.09),
        (4000.03, 0.12),
        (7786.02, 0.14)
    ]
    
    inss = 0.0
    salario_restante = min(sb, teto_inss)
    faixa_anterior = 0
    
    for limite, aliquota in faixas_inss:
        if salario_restante > faixa_anterior:
            base_faixa = min(salario_restante, limite) - faixa_anterior
            inss += base_faixa * aliquota
            faixa_anterior = limite
        else:
            break
            
    # B. Cálculo IRRF (Tabela Vigente 2024 - A partir de Fev/24)
    # Dedução por dependente: R$ 189,59
    deducao_dependente = dados.dependentes * 189.59
    base_irrf = sb - inss - deducao_dependente
    
    # Faixas IRRF e Parcelas a deduzir
    faixas_irrf = [
        (2259.20, 0.0, 0.0),
        (2826.65, 0.075, 169.44),
        (3751.05, 0.15, 381.44),
        (4664.68, 0.225, 662.77),
        (float('inf'), 0.275, 896.00)
    ]
    
    irrf = 0.0
    for limite, aliquota, deducao in faixas_irrf:
        if base_irrf <= limite:
            irrf = (base_irrf * aliquota) - deducao
            break
            
    if irrf < 0: irrf = 0.0
    
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