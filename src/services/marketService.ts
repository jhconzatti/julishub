// Obtém a URL base e remove a barra final se existir para evitar duplicidade
const getBaseUrl = () => {
    const url = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    return url.replace(/\/$/, "");
};

const API_BASE_URL = getBaseUrl();

export interface MarketData {
    dolar: { valor: string; var: string };
    euro: { valor: string; var: string };
    bitcoin: { valor: string; var: string };
    ibovespa: { valor: string; var: string };
}

export const getMarketData = async (): Promise<MarketData | null> => {
    try {
        // A URL final será algo como https://.../api/cotacao
        const response = await fetch(`${API_BASE_URL}/cotacao`);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Erro na API, usando fallback local:", error);
        
        // Fallback silencioso para não quebrar a tela inteira se a API falhar
        return {
            dolar: { valor: "0.00", var: "0.00" },
            euro: { valor: "0.00", var: "0.00" },
            bitcoin: { valor: "0.00", var: "0.00" },
            ibovespa: { valor: "0.00", var: "0.00" }
        };
    }
};