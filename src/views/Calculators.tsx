import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calculator, TrendingUp, Landmark, Wallet, Coins, ArrowRight } from "lucide-react";

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

export default function Calculators() {
  // --- ESTADOS: INVESTIMENTO ---
  const [formInvest, setFormInvest] = useState({
    aporte_inicial: 1000,
    aporte_mensal: 500,
    taxa_anual: 12,
    anos: 10
  });
  const [resultadoInvest, setResultadoInvest] = useState<any>(null);
  const [loadingInvest, setLoadingInvest] = useState(false);

  // --- ESTADOS: FINANCIAMENTO ---
  const [formLoan, setFormLoan] = useState({
    valor_financiamento: 50000,
    taxa_mensal: 1.5,
    meses: 48
  });
  const [resultadoLoan, setResultadoLoan] = useState<any>(null);
  const [loadingLoan, setLoadingLoan] = useState(false);

  // --- ESTADOS: SALÁRIO LÍQUIDO (NOVO) ---
  const [formSalary, setFormSalary] = useState({
    salario_bruto: 3000,
    dependentes: 0,
    outros_descontos: 0
  });
  const [resultadoSalary, setResultadoSalary] = useState<any>(null);
  const [loadingSalary, setLoadingSalary] = useState(false);


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
        body: JSON.stringify(formInvest)
      });
      if (!response.ok) throw new Error(`Erro API: ${response.status}`);
      const data = await response.json();
      setResultadoInvest(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingInvest(false);
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
        body: JSON.stringify(formLoan)
      });
      if (!response.ok) throw new Error(`Erro API: ${response.status}`);
      const data = await response.json();
      setResultadoLoan(data);
    } catch (error) {
      console.error(error);
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
        body: JSON.stringify(formSalary)
      });
      if (!response.ok) throw new Error(`Erro API: ${response.status}`);
      const data = await response.json();
      setResultadoSalary(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSalary(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Calculadoras Financeiras</h2>
        <p className="text-muted-foreground">Planejamento, dívidas e trabalhista em um só lugar.</p>
      </div>

      <Tabs defaultValue="investimento" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="investimento">Investimentos</TabsTrigger>
          <TabsTrigger value="financiamento">Empréstimos</TabsTrigger>
          <TabsTrigger value="salario">Salário Líquido</TabsTrigger>
        </TabsList>

        {/* --- ABA DE INVESTIMENTOS --- */}
        <TabsContent value="investimento" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3 mt-4">
            <Card className="lg:col-span-1 h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" /> Juros Compostos
                </CardTitle>
                <CardDescription>Simule o crescimento do seu dinheiro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Aporte Inicial (R$)</Label>
                  <Input type="number" name="aporte_inicial" value={formInvest.aporte_inicial} onChange={handleInvestChange} />
                </div>
                <div className="space-y-2">
                  <Label>Aporte Mensal (R$)</Label>
                  <Input type="number" name="aporte_mensal" value={formInvest.aporte_mensal} onChange={handleInvestChange} />
                </div>
                <div className="space-y-2">
                  <Label>Taxa Anual (%)</Label>
                  <Input type="number" name="taxa_anual" value={formInvest.taxa_anual} onChange={handleInvestChange} />
                </div>
                <div className="space-y-2">
                  <Label>Anos</Label>
                  <Input type="number" name="anos" value={formInvest.anos} onChange={handleInvestChange} />
                </div>
                <Button className="w-full mt-4" onClick={calcularInvestimento} disabled={loadingInvest}>
                  {loadingInvest ? "Calculando..." : "Simular"}
                </Button>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              {resultadoInvest && resultadoInvest.resumo ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-slate-50 dark:bg-slate-900">
                      <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Total Investido</CardTitle></CardHeader>
                      <CardContent><div className="text-xl font-bold text-slate-600">R$ {resultadoInvest.resumo.total_investido?.toLocaleString()}</div></CardContent>
                    </Card>
                    <Card className="bg-green-50 dark:bg-green-950/30 border-green-200">
                      <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-green-600">Total em Juros</CardTitle></CardHeader>
                      <CardContent><div className="text-xl font-bold text-green-600">+ R$ {resultadoInvest.resumo.total_juros?.toLocaleString()}</div></CardContent>
                    </Card>
                    <Card className="bg-primary/10 border-primary/20">
                      <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-primary">Patrimônio Final</CardTitle></CardHeader>
                      <CardContent><div className="text-xl font-bold text-primary">R$ {resultadoInvest.resumo.total_final?.toLocaleString()}</div></CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardContent className="h-[300px] pt-6">
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
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl p-10 min-h-[300px]">
                  <TrendingUp className="w-16 h-16 mb-4 opacity-20" />
                  <p>{loadingInvest ? "Processando..." : "Preencha e simule para ver o gráfico."}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* --- ABA DE FINANCIAMENTOS --- */}
        <TabsContent value="financiamento" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3 mt-4">
            <Card className="lg:col-span-1 h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-red-500" /> Financiamento (Price)
                </CardTitle>
                <CardDescription>Calcule a prestação mensal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Valor Financiado (R$)</Label>
                  <Input type="number" name="valor_financiamento" value={formLoan.valor_financiamento} onChange={handleLoanChange} />
                </div>
                <div className="space-y-2">
                  <Label>Taxa Mensal (%)</Label>
                  <Input type="number" name="taxa_mensal" value={formLoan.taxa_mensal} onChange={handleLoanChange} />
                </div>
                <div className="space-y-2">
                  <Label>Meses</Label>
                  <Input type="number" name="meses" value={formLoan.meses} onChange={handleLoanChange} />
                </div>
                <Button className="w-full mt-4" variant="secondary" onClick={calcularFinanciamento} disabled={loadingLoan}>
                  {loadingLoan ? "Calculando..." : "Calcular Parcela"}
                </Button>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              {resultadoLoan ? (
                <div className="grid gap-6 animate-in slide-in-from-bottom-4">
                  <Card className="bg-primary text-primary-foreground border-none shadow-lg">
                    <CardHeader>
                      <CardTitle>Sua Parcela Mensal</CardTitle>
                      <CardDescription className="text-primary-foreground/80">Sistema de Amortização Francês (Price)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-5xl font-extrabold">R$ {resultadoLoan.valor_prestacao?.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Total a Pagar</CardTitle></CardHeader>
                      <CardContent><div className="text-2xl font-bold text-red-600">R$ {resultadoLoan.total_pago?.toLocaleString()}</div></CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Total em Juros</CardTitle></CardHeader>
                      <CardContent><div className="text-2xl font-bold text-orange-500">R$ {resultadoLoan.total_juros?.toLocaleString()}</div></CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl p-10 min-h-[300px]">
                  <Calculator className="w-16 h-16 mb-4 opacity-20" />
                  <p>{loadingLoan ? "Processando..." : "Informe valor e taxa para calcular."}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* --- ABA DE SALÁRIO LÍQUIDO (NOVA) --- */}
        <TabsContent value="salario" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3 mt-4">
            <Card className="lg:col-span-1 h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-500" /> Salário Líquido
                </CardTitle>
                <CardDescription>Descontos de INSS e IRRF (2024)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Salário Bruto (R$)</Label>
                  <Input type="number" name="salario_bruto" value={formSalary.salario_bruto} onChange={handleSalaryChange} />
                </div>
                <div className="space-y-2">
                  <Label>Dependentes</Label>
                  <Input type="number" name="dependentes" value={formSalary.dependentes} onChange={handleSalaryChange} />
                </div>
                <div className="space-y-2">
                  <Label>Outros Descontos (R$)</Label>
                  <Input type="number" name="outros_descontos" value={formSalary.outros_descontos} onChange={handleSalaryChange} />
                </div>
                <Button className="w-full mt-4" onClick={calcularSalario} disabled={loadingSalary} className="bg-blue-600 hover:bg-blue-700">
                  {loadingSalary ? "Calculando..." : "Calcular Salário"}
                </Button>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              {resultadoSalary ? (
                <div className="grid gap-6 animate-in slide-in-from-bottom-4">
                  {/* Card Principal */}
                  <Card className="bg-blue-600 text-white border-none shadow-lg">
                    <CardHeader>
                      <CardTitle>Salário Líquido Estimado</CardTitle>
                      <CardDescription className="text-blue-100">Valor disponível após descontos legais</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <div className="text-5xl font-extrabold">R$ {resultadoSalary.salario_liquido?.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                      <Coins className="w-16 h-16 text-blue-400 opacity-50" />
                    </CardContent>
                  </Card>

                  {/* Detalhamento */}
                  <div className="grid gap-4">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Detalhamento dos Descontos</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                            <span className="text-muted-foreground flex items-center"><ArrowRight className="w-4 h-4 mr-2" /> INSS</span>
                            <span className="font-bold text-red-500">- R$ {resultadoSalary.inss?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                            <span className="text-muted-foreground flex items-center"><ArrowRight className="w-4 h-4 mr-2" /> IRRF</span>
                            <span className="font-bold text-red-500">- R$ {resultadoSalary.irrf?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                            <span className="text-muted-foreground flex items-center"><ArrowRight className="w-4 h-4 mr-2" /> Outros</span>
                            <span className="font-bold text-red-500">- R$ {resultadoSalary.outros_descontos?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                          <div className="border-t pt-2 flex justify-between items-center">
                             <span className="font-bold">Total de Descontos</span>
                             <span className="font-bold text-red-600">R$ {resultadoSalary.total_descontos?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl p-10 min-h-[300px]">
                  <Wallet className="w-16 h-16 mb-4 opacity-20" />
                  <p>{loadingSalary ? "Processando..." : "Informe o salário bruto e dependentes."}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}