// Dados falsos para quando você estiver offline
const MOCK_DATA = {
  dolar: { valor: "5.15", var: "0.5" },
  bitcoin: { valor: "65000", var: "-1.2" }
};

// Verifica a variável de ambiente (O Vite obriga usar import.meta.env)
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const API_URL = import.meta.env.VITE_API_URL;

export const getMarketData = async () => {
  // 1. Se estiver em modo Mock, retorna o JSON direto (Offline)
  if (USE_MOCK) {
    console.log("⚠️ Usando dados MOCK (Offline)");
    // Simulamos um delay de 500ms para parecer real
    await new Promise(resolve => setTimeout(resolve, 500)); 
    return MOCK_DATA;
  }

  // 2. Se estiver Online, chama o Python
  try {
    const response = await fetch(`${API_URL}/cotacao`);
    if (!response.ok) throw new Error('Falha na API');
    return await response.json();
  } catch (error) {
    console.error("Erro na API, usando fallback:", error);
    return null;
  }
};