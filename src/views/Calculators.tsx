import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calculator, TrendingUp, Landmark, Wallet, Coins, ArrowRight, History, GitCompare, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import ExchangeCalculator from "@/components/ExchangeCalculator";
import ReservePlanner from "@/components/ReservePlanner";
import FinancingPrepaymentComparison from "@/components/FinancingPrepaymentComparison";

// --- CONFIGURAÇÃO DA API ---
const getApiBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
  url = url.replace(/\/$/, ""); // Remove barra final
  if (!url.endsWith("/api")) {
    url += "/api";
  }
  return url;
};

const API_BASE_URL = getApiBaseUrl();

// --- TIPOS ---
interface FormInvest {
  aporte_inicial: number;
  aporte_mensal: number;
  taxa_anual: number;
  anos: number;
}

interface FormLoan {
  valor_financiamento: number;
  taxa_mensal: number;
  meses: number;
}

interface FormSalary {
  salario_bruto: number;
  dependentes: number;
  outros_descontos: number;
}

interface InvestmentPoint {
  mes: number;
  ano: number;
  investido: number;
  juros: number;
  total: number;
}

interface InvestmentResult {
  grafico: InvestmentPoint[];
  resumo: {
    total_investido: number;
    total_juros: number;
    total_final: number;
  };
}

interface LoanResult {
  valor_prestacao: number;
  total_pago: number;
  total_juros: number;
  resumo_texto: string;
}

interface SalaryResult {
  salario_bruto: number;
  inss: number;
  irrf: number;
  outros_descontos: number;
  salario_liquido: number;
  total_descontos: number;
}

interface ComparisonResult extends InvestmentResult {
  nome: string;
  cor: string;
}

// --- CHAVES DO LOCALSTORAGE ---
const STORAGE_KEYS = {
  INVEST: 'julishub_form_invest',
  LOAN: 'julishub_form_loan',
  SALARY: 'julishub_form_salary',
  HISTORY_INVEST: 'julishub_history_invest',
  COMPARE_SCENARIOS: 'julishub_compare_scenarios',
};

// --- TIPOS PARA HISTÓRICO ---
interface HistoryItem {
  id: string;
  timestamp: number;
  form: FormInvest;
  resultado: InvestmentResult;
  nome?: string;
}

interface CompareScenario {
  id: string;
  nome: string;
  form: FormInvest;
  cor: string;
}

// --- VALORES PADRÃO ---
const DEFAULT_FORM_INVEST: FormInvest = {
  aporte_inicial: 1000,
  aporte_mensal: 500,
  taxa_anual: 12,
  anos: 10,
};

const DEFAULT_FORM_LOAN: FormLoan = {
  valor_financiamento: 50000,
  taxa_mensal: 1.5,
  meses: 48,
};

const DEFAULT_FORM_SALARY: FormSalary = {
  salario_bruto: 3000,
  dependentes: 0,
  outros_descontos: 0,
};

// --- FUNÇÕES DE PERSISTÊNCIA ---
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (error) {
    console.error(`Erro ao carregar ${key} do localStorage:`, error);
  }
  return defaultValue;
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Erro ao salvar ${key} no localStorage:`, error);
  }
};

export default function Calculators() {
  const { t } = useTranslation();
  
  // --- ESTADOS: INVESTIMENTO ---
  const [formInvest, setFormInvest] = useState<FormInvest>(() =>
    loadFromStorage(STORAGE_KEYS.INVEST, DEFAULT_FORM_INVEST)
  );
  const [resultadoInvest, setResultadoInvest] = useState<InvestmentResult | null>(null);
  const [loadingInvest, setLoadingInvest] = useState(false);

  // --- ESTADOS: FINANCIAMENTO ---
  const [formLoan, setFormLoan] = useState<FormLoan>(() =>
    loadFromStorage(STORAGE_KEYS.LOAN, DEFAULT_FORM_LOAN)
  );
  const [resultadoLoan, setResultadoLoan] = useState<LoanResult | null>(null);
  const [loadingLoan, setLoadingLoan] = useState(false);

  // --- ESTADOS: SALÁRIO LÍQUIDO ---
  const [formSalary, setFormSalary] = useState<FormSalary>(() =>
    loadFromStorage(STORAGE_KEYS.SALARY, DEFAULT_FORM_SALARY)
  );
  const [resultadoSalary, setResultadoSalary] = useState<SalaryResult | null>(null);
  const [loadingSalary, setLoadingSalary] = useState(false);

  // --- ESTADOS: HISTÓRICO E COMPARAÇÃO ---
  const [historico, setHistorico] = useState<HistoryItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.HISTORY_INVEST, [])
  );
  const [cenarios, setCenarios] = useState<CompareScenario[]>(() =>
    loadFromStorage(STORAGE_KEYS.COMPARE_SCENARIOS, [])
  );
  const [comparacaoResultados, setComparacaoResultados] = useState<ComparisonResult[]>([]);
  const [loadingComparacao, setLoadingComparacao] = useState(false);

  // --- EFEITOS DE PERSISTÊNCIA ---
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.INVEST, formInvest);
  }, [formInvest]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.LOAN, formLoan);
  }, [formLoan]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SALARY, formSalary);
  }, [formSalary]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.HISTORY_INVEST, historico);
  }, [historico]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.COMPARE_SCENARIOS, cenarios);
  }, [cenarios]);

  // --- HANDLERS ---
  const handleInvestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormInvest({ ...formInvest, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const handleLoanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormLoan({ ...formLoan, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormSalary({ ...formSalary, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  // --- CÁLCULO: INVESTIMENTO ---
  const calcularInvestimento = async () => {
    setLoadingInvest(true);
    setResultadoInvest(null);
    try {
      const response = await fetch(`${API_BASE_URL}/juros-compostos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formInvest),
      });
      if (!response.ok) {
        throw new Error(`Erro API: ${response.status}`);
      }
      const data = (await response.json()) as InvestmentResult;
      setResultadoInvest(data);
      
      // Salvar no histórico
      salvarNoHistorico(formInvest, data);
      
      toast.success("Simulação calculada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao calcular investimento. Verifique sua conexão.");
    } finally {
      setLoadingInvest(false);
    }
  };

  // --- FUNÇÕES DE HISTÓRICO ---
  const salvarNoHistorico = (form: FormInvest, resultado: InvestmentResult) => {
    const novoItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      form,
      resultado,
      nome: `Simulação ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    };
    setHistorico([novoItem, ...historico].slice(0, 10)); // Mantém últimas 10
  };

  const carregarDoHistorico = (item: HistoryItem) => {
    setFormInvest(item.form);
    setResultadoInvest(item.resultado);
    toast.success("Simulação carregada do histórico!");
  };

  const removerDoHistorico = (id: string) => {
    setHistorico(historico.filter(item => item.id !== id));
    toast.success("Item removido do histórico");
  };

  const limparHistorico = () => {
    setHistorico([]);
    toast.success("Histórico limpo");
  };

  // --- FUNÇÕES DE COMPARAÇÃO ---
  const adicionarCenario = () => {
    if (cenarios.length >= 3) {
      toast.error("Máximo de 3 cenários para comparação");
      return;
    }
    
    const cores = ['#3b82f6', '#10b981', '#f59e0b'];
    const novoCenario: CompareScenario = {
      id: Date.now().toString(),
      nome: `Cenário ${cenarios.length + 1}`,
      form: { ...formInvest },
      cor: cores[cenarios.length],
    };
    setCenarios([...cenarios, novoCenario]);
    toast.success("Cenário adicionado para comparação!");
  };

  const removerCenario = (id: string) => {
    setCenarios(cenarios.filter(c => c.id !== id));
    toast.success("Cenário removido");
  };

  const compararCenarios = async () => {
    if (cenarios.length === 0) {
      toast.error("Adicione pelo menos um cenário para comparar");
      return;
    }

    setLoadingComparacao(true);
    const resultados: ComparisonResult[] = [];

    try {
      for (const cenario of cenarios) {
        const response = await fetch(`${API_BASE_URL}/juros-compostos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cenario.form),
        });
        if (response.ok) {
          const data = (await response.json()) as InvestmentResult;
          resultados.push({ ...data, nome: cenario.nome, cor: cenario.cor });
        }
      }
      setComparacaoResultados(resultados);
      toast.success("Comparação realizada!");
    } catch (error) {
      toast.error("Erro ao comparar cenários");
    } finally {
      setLoadingComparacao(false);
    }
  };

  // --- CÁLCULO: FINANCIAMENTO ---
  const calcularFinanciamento = async () => {
    setLoadingLoan(true);
    setResultadoLoan(null);
    try {
      const response = await fetch(`${API_BASE_URL}/financiamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formLoan),
      });
      if (!response.ok) {
        throw new Error(`Erro API: ${response.status}`);
      }
      const data = (await response.json()) as LoanResult;
      setResultadoLoan(data);
      toast.success("Financiamento calculado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao calcular financiamento. Verifique sua conexão.");
    } finally {
      setLoadingLoan(false);
    }
  };

  // --- CÁLCULO: SALÁRIO LÍQUIDO ---
  const calcularSalario = async () => {
    setLoadingSalary(true);
    setResultadoSalary(null);
    try {
      const response = await fetch(`${API_BASE_URL}/salario-liquido`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formSalary),
      });
      if (!response.ok) {
        throw new Error(`Erro API: ${response.status}`);
      }
      const data = (await response.json()) as SalaryResult;
      setResultadoSalary(data);
      toast.success("Salário calculado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao calcular salário. Verifique sua conexão.");
    } finally {
      setLoadingSalary(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('calculators.title')}</h2>
        <p className="text-muted-foreground">{t('calculators.description')}</p>
      </div>

      <Tabs defaultValue="investimento" className="w-full">
        <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="investimento" className="h-11 whitespace-normal px-2 text-xs leading-tight sm:h-8 sm:px-3 sm:text-sm">{t('calculators.investments')}</TabsTrigger>
          <TabsTrigger value="financiamento" className="h-11 whitespace-normal px-2 text-xs leading-tight sm:h-8 sm:px-3 sm:text-sm">{t('calculators.loans')}</TabsTrigger>
          <TabsTrigger value="salario" className="h-11 whitespace-normal px-2 text-xs leading-tight sm:h-8 sm:px-3 sm:text-sm">{t('calculators.netSalary')}</TabsTrigger>
          <TabsTrigger value="exchange" className="h-11 whitespace-normal px-2 text-xs leading-tight sm:h-8 sm:px-3 sm:text-sm">{t('calculators.exchange')}</TabsTrigger>
          <TabsTrigger value="reserve" className="h-11 whitespace-normal px-2 text-xs leading-tight sm:h-8 sm:px-3 sm:text-sm">{t('reservePlanner.tab')}</TabsTrigger>
        </TabsList>

        {/* --- ABA DE INVESTIMENTOS --- */}
        <TabsContent value="investimento" className="mt-4 space-y-6">
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="h-fit border-border/70 bg-card lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" /> {t('calculators.compoundInterest')}
                </CardTitle>
                <CardDescription>{t('calculators.simulateGrowth')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>{t('calculators.initialAmount')}</Label>
                  <Input type="number" name="aporte_inicial" value={formInvest.aporte_inicial} onChange={handleInvestChange} />
                </div>
                <div className="space-y-2">
                  <Label>{t('calculators.monthlyContribution')}</Label>
                  <Input type="number" name="aporte_mensal" value={formInvest.aporte_mensal} onChange={handleInvestChange} />
                </div>
                <div className="space-y-2">
                  <Label>{t('calculators.annualRate')}</Label>
                  <Input type="number" name="taxa_anual" value={formInvest.taxa_anual} onChange={handleInvestChange} />
                </div>
                <div className="space-y-2">
                  <Label>{t('calculators.years')}</Label>
                  <Input type="number" name="anos" value={formInvest.anos} onChange={handleInvestChange} />
                </div>
                <Button className="mt-2 h-10 w-full" onClick={calcularInvestimento} disabled={loadingInvest}>
                  {loadingInvest ? t('calculators.calculating') : t('calculators.calculate')}
                </Button>
                
                {/* Botões de Histórico e Comparação */}
                <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border/70 pt-4 sm:grid-cols-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <History className="w-4 h-4 mr-2" />
                        Histórico
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Histórico de Simulações</DialogTitle>
                        <DialogDescription>
                          Últimas 10 simulações realizadas
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-[400px] max-h-[60vh] w-full">
                        {historico.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">Nenhuma simulação salva ainda</p>
                        ) : (
                          <div className="space-y-2 pr-4">
                            {historico.map((item) => (
                              <Card key={item.id} className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 space-y-1">
                                    <p className="text-sm font-semibold">{item.nome}</p>
                                    <p className="text-xs text-muted-foreground">
                                      R$ {item.form.aporte_inicial} inicial + R$ {item.form.aporte_mensal}/mês
                                      • {item.form.taxa_anual}% a.a. • {item.form.anos} anos
                                    </p>
                                    <p className="text-xs font-bold text-primary">
                                      Resultado: R$ {item.resultado.resumo?.total_final?.toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => carregarDoHistorico(item)}
                                    >
                                      Carregar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removerDoHistorico(item.id)}
                                      aria-label={t('calculators.removeSavedSimulation')}
                                      title={t('calculators.removeSavedSimulation')}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                      {historico.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={limparHistorico}>
                          Limpar Histórico
                        </Button>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <GitCompare className="w-4 h-4 mr-2" />
                        Comparar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Comparação de Cenários</DialogTitle>
                        <DialogDescription>
                          Compare até 3 cenários de investimento diferentes
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button className="w-full sm:w-auto" onClick={adicionarCenario} disabled={cenarios.length >= 3}>
                            <Save className="w-4 h-4 mr-2" />
                            Adicionar Cenário Atual ({cenarios.length}/3)
                          </Button>
                          {cenarios.length > 0 && (
                            <Button className="w-full sm:w-auto" onClick={compararCenarios} disabled={loadingComparacao}>
                              {loadingComparacao ? "Comparando..." : "Comparar Cenários"}
                            </Button>
                          )}
                        </div>

                        {cenarios.length > 0 && (
                          <div className="grid gap-2">
                            {cenarios.map((cenario) => (
                              <Card key={cenario.id} className="p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: cenario.cor }}
                                    />
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold">{cenario.nome}</p>
                                      <p className="text-xs text-muted-foreground">
                                        R$ {cenario.form.aporte_inicial} + R$ {cenario.form.aporte_mensal}/mês
                                        • {cenario.form.taxa_anual}% • {cenario.form.anos} anos
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="shrink-0"
                                    onClick={() => removerCenario(cenario.id)}
                                    aria-label={t('calculators.removeScenario')}
                                    title={t('calculators.removeScenario')}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}

                        {comparacaoResultados.length > 0 && (
                          <Card className="p-4">
                            <h4 className="font-semibold mb-4">Gráfico Comparativo</h4>
                            <div className="h-[240px] sm:h-[300px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="ano" />
                                  <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} />
                                  <Legend />
                                  {comparacaoResultados.map((resultado, idx) => (
                                    <Line
                                      key={idx}
                                      type="monotone"
                                      data={resultado.grafico}
                                      dataKey="total"
                                      name={resultado.nome}
                                      stroke={resultado.cor}
                                      strokeWidth={2}
                                    />
                                  ))}
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                              {comparacaoResultados.map((resultado, idx) => (
                                <div key={idx} className="flex flex-col items-start gap-2 rounded bg-muted p-2 sm:flex-row sm:items-center sm:justify-between">
                                  <span className="flex min-w-0 items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: resultado.cor }} />
                                    {resultado.nome}
                                  </span>
                                  <span className="font-bold">R$ {resultado.resumo?.total_final?.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </Card>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6 lg:col-span-2">
              {resultadoInvest && resultadoInvest.resumo ? (
                <>
                  <div className="space-y-4">
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-primary">{t('calculators.finalValue')}</CardTitle></CardHeader>
                      <CardContent><div className="break-words text-2xl font-bold text-primary sm:text-3xl">R$ {resultadoInvest.resumo.total_final?.toLocaleString()}</div></CardContent>
                    </Card>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Card className="border-border/70 bg-muted/30">
                      <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">{t('calculators.totalInvested')}</CardTitle></CardHeader>
                      <CardContent><div className="text-xl font-bold">R$ {resultadoInvest.resumo.total_investido?.toLocaleString()}</div></CardContent>
                    </Card>
                    <Card className="border-green-200 bg-green-50/60 dark:border-green-900 dark:bg-green-950/20">
                      <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-green-600">{t('calculators.totalInterest')}</CardTitle></CardHeader>
                      <CardContent><div className="text-xl font-bold text-green-600">+ R$ {resultadoInvest.resumo.total_juros?.toLocaleString()}</div></CardContent>
                    </Card>
                    </div>
                  </div>
                  <Card className="border-border/70 bg-card">
                    <CardContent className="h-[240px] pt-6 sm:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={resultadoInvest.grafico}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="ano" tick={{fontSize: 12}} />
                          <YAxis tickFormatter={(v) => `R$${v/1000}k`} tick={{fontSize: 12}} />
                          <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString()}`, ""]} />
                          <Legend />
                          <Bar dataKey="investido" name="Investido" stackId="a" fill="#94a3b8" />
                          <Bar dataKey="juros" name="Juros" stackId="a" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-muted-foreground sm:min-h-[300px] sm:p-10">
                  <TrendingUp className="w-16 h-16 mb-4 opacity-20" />
                  <p>{loadingInvest ? t('calculators.processing') : t('calculators.fillAndSimulate')}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* --- ABA DE FINANCIAMENTOS --- */}
        <TabsContent value="financiamento" className="mt-4 space-y-6">
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="h-fit border-border/70 bg-card lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-red-500" /> {t('calculators.financing')}
                </CardTitle>
                <CardDescription>{t('calculators.calculatePayment')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>{t('calculators.financingAmount')}</Label>
                  <Input type="number" name="valor_financiamento" value={formLoan.valor_financiamento} onChange={handleLoanChange} />
                </div>
                <div className="space-y-2">
                  <Label>{t('calculators.monthlyRate')}</Label>
                  <Input type="number" name="taxa_mensal" value={formLoan.taxa_mensal} onChange={handleLoanChange} />
                </div>
                <div className="space-y-2">
                  <Label>{t('calculators.months')}</Label>
                  <Input type="number" name="meses" value={formLoan.meses} onChange={handleLoanChange} />
                </div>
                <Button className="mt-2 h-10 w-full" onClick={calcularFinanciamento} disabled={loadingLoan}>
                  {loadingLoan ? t('calculators.calculating') : t('calculators.calculate')}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6 lg:col-span-2">
              {resultadoLoan ? (
                <div className="grid gap-6 animate-in slide-in-from-bottom-4">
                  <Card className="bg-primary text-primary-foreground border-none shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle>{t('calculators.monthlyPayment')}</CardTitle>
                      <CardDescription className="text-primary-foreground/80">{t('calculators.priceSystem')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="break-words text-3xl font-extrabold sm:text-5xl">R$ {resultadoLoan.valor_prestacao?.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-border/70 bg-card">
                      <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">{t('calculators.totalPaid')}</CardTitle></CardHeader>
                      <CardContent><div className="text-2xl font-bold text-red-600">R$ {resultadoLoan.total_pago?.toLocaleString()}</div></CardContent>
                    </Card>
                    <Card className="border-border/70 bg-card">
                      <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">{t('calculators.totalInterest')}</CardTitle></CardHeader>
                      <CardContent><div className="text-2xl font-bold text-orange-500">R$ {resultadoLoan.total_juros?.toLocaleString()}</div></CardContent>
                    </Card>
                  </div>
                  <FinancingPrepaymentComparison financing={formLoan} />
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-muted-foreground sm:min-h-[300px] sm:p-10">
                  <Calculator className="w-16 h-16 mb-4 opacity-20" />
                  <p>{loadingLoan ? t('calculators.processing') : t('calculators.enterValueAndRate')}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* --- ABA DE SALÁRIO LÍQUIDO (NOVA) --- */}
        <TabsContent value="salario" className="mt-4 space-y-6">
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="h-fit border-border/70 bg-card lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-500" /> {t('calculators.netSalary')}
                </CardTitle>
                <CardDescription>{t('calculators.inssIrrfDeductions')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>{t('calculators.grossSalary')}</Label>
                  <Input type="number" name="salario_bruto" value={formSalary.salario_bruto} onChange={handleSalaryChange} />
                </div>
                <div className="space-y-2">
                  <Label>{t('calculators.dependents')}</Label>
                  <Input type="number" name="dependentes" value={formSalary.dependentes} onChange={handleSalaryChange} />
                </div>
                <div className="space-y-2">
                  <Label>{t('calculators.otherDeductions')}</Label>
                  <Input type="number" name="outros_descontos" value={formSalary.outros_descontos} onChange={handleSalaryChange} />
                </div>
                <Button className="mt-2 h-10 w-full" onClick={calcularSalario} disabled={loadingSalary}>
                  {loadingSalary ? t('calculators.calculating') : t('calculators.calculate')}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6 lg:col-span-2">
              {resultadoSalary ? (
                <div className="grid gap-6 animate-in slide-in-from-bottom-4">
                  {/* Card Principal */}
                  <Card className="bg-blue-600 text-white border-none shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle>{t('calculators.netSalary')}</CardTitle>
                      <CardDescription className="text-blue-100">{t('calculators.availableAfterDeductions')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-4">
                      <div className="break-words text-3xl font-extrabold sm:text-5xl">R$ {resultadoSalary.salario_liquido?.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                      <Coins className="hidden h-16 w-16 shrink-0 text-blue-400 opacity-50 sm:block" />
                    </CardContent>
                  </Card>

                  {/* Detalhamento */}
                  <div className="grid gap-4">
                    <Card className="border-border/70 bg-card">
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">{t('calculators.deductionsBreakdown')}</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3 rounded bg-muted/50 p-2">
                            <span className="text-muted-foreground flex items-center"><ArrowRight className="w-4 h-4 mr-2" /> INSS</span>
                            <span className="font-bold text-red-500">- R$ {resultadoSalary.inss?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded bg-muted/50 p-2">
                            <span className="text-muted-foreground flex items-center"><ArrowRight className="w-4 h-4 mr-2" /> IRRF</span>
                            <span className="font-bold text-red-500">- R$ {resultadoSalary.irrf?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded bg-muted/50 p-2">
                            <span className="text-muted-foreground flex items-center"><ArrowRight className="w-4 h-4 mr-2" /> {t('calculators.others')}</span>
                            <span className="font-bold text-red-500">- R$ {resultadoSalary.outros_descontos?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 border-t pt-2">
                             <span className="font-bold">{t('calculators.totalDeductions')}</span>
                             <span className="font-bold text-red-600">R$ {resultadoSalary.total_descontos?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-muted-foreground sm:min-h-[300px] sm:p-10">
                  <Wallet className="w-16 h-16 mb-4 opacity-20" />
                  <p>{loadingSalary ? t('calculators.processing') : t('calculators.enterSalaryAndDependents')}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* --- ABA DE CÂMBIO --- */}
        <TabsContent value="exchange" className="mt-4 space-y-6">
          <ExchangeCalculator />
        </TabsContent>

        <TabsContent value="reserve" className="mt-4 space-y-6">
          <ReservePlanner />
        </TabsContent>
      </Tabs>
    </div>
  );
}
