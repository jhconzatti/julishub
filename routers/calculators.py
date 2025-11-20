from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter()

# Modelo de Dados (O que o Frontend PRECISA mandar)
class JurosInput(BaseModel):
    aporte_inicial: float
    aporte_mensal: float
    taxa_anual: float
    anos: int

@router.post("/juros-compostos")
def calcular_juros(dados: JurosInput):
    # Validar limites para não travar o servidor
    if dados.anos > 50:
        raise HTTPException(status_code=400, detail="O prazo máximo é de 50 anos.")
    
    historico = []
    total_investido = dados.aporte_inicial
    total_acumulado = dados.aporte_inicial
    
    # Converter taxa anual para mensal
    taxa_mensal = (1 + dados.taxa_anual / 100) ** (1/12) - 1
    
    meses = dados.anos * 12
    
    # Loop mês a mês (simulando a realidade)
    for mes in range(1, meses + 1):
        # Rendimento do mês
        total_acumulado = total_acumulado * (1 + taxa_mensal)
        
        # Adicionar aporte mensal
        total_acumulado += dados.aporte_mensal
        total_investido += dados.aporte_mensal
        
        # A cada 12 meses (1 ano), salvamos um "snapshot" para o gráfico
        if mes % 12 == 0:
            ano = mes // 12
            historico.append({
                "ano": f"Ano {ano}",
                "investido": round(total_investido, 2),
                "juros": round(total_acumulado - total_investido, 2),
                "total": round(total_acumulado, 2)
            })
            
    return {
        "resumo": {
            "total_investido": round(total_investido, 2),
            "total_juros": round(total_acumulado - total_investido, 2),
            "total_final": round(total_acumulado, 2)
        },
        "grafico": historico
    }