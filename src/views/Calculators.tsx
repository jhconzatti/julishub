import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calculator, DollarSign, TrendingUp } from "lucide-react";

export default function Calculators() {
  // Estado do Formulário
  const [form, setForm] = useState({
    aporte_inicial: 1000,
    aporte_mensal: 500,
    taxa_anual: 12,
    anos: 10
  });

  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const calcular = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/juros-compostos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      
      const data = await response.json();
      setResultado(data);
    } catch (error) {
      console.error("Erro ao calcular", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Simulador de Investimentos</h2>
        <p className="text-muted-foreground">Descubra o poder dos juros compostos no longo prazo.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Coluna 1: Formulário de Input */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" /> Parâmetros
            </CardTitle>
            <CardDescription>Preencha os dados da simulação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Aporte Inicial (R$)</Label>
              <Input type="number" name="aporte_inicial" value={form.aporte_inicial} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Aporte Mensal (R$)</Label>
              <Input type="number" name="aporte_mensal" value={form.aporte_mensal} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Taxa de Juros Anual (%)</Label>
              <Input type="number" name="taxa_anual" value={form.taxa_anual} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Tempo (Anos)</Label>
              <Input type="number" name="anos" value={form.anos} onChange={handleChange} />
            </div>
            
            <Button className="w-full mt-4" onClick={calcular} disabled={loading}>
              {loading ? "Calculando..." : "Simular Futuro"}
            </Button>
          </CardContent>
        </Card>

        {/* Coluna 2: Resultados e Gráfico */}
        <div className="lg:col-span-2 space-y-6">
          {resultado ? (
            <>
              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-50 dark:bg-slate-900">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Investido</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold text-slate-600">R$ {resultado.resumo.total_investido.toLocaleString()}</div></CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-950/30 border-green-200">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-green-600 dark:text-green-400">Total em Juros</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold text-green-600 dark:text-green-400">+ R$ {resultado.resumo.total_juros.toLocaleString()}</div></CardContent>
                </Card>
                <Card className="bg-primary/10 border-primary/20">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-primary">Patrimônio Final</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold text-primary">R$ {resultado.resumo.total_final.toLocaleString()}</div></CardContent>
                </Card>
              </div>

              {/* Gráfico */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolução Patrimonial</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resultado.grafico} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="ano" tick={{fontSize: 12}} />
                      <YAxis tickFormatter={(value) => `R$${value/1000}k`} tick={{fontSize: 12}} />
                      <Tooltip 
                        formatter={(value: number) => [`R$ ${value.toLocaleString()}`, ""]}
                        contentStyle={{borderRadius: '8px'}}
                      />
                      <Legend />
                      <Bar dataKey="investido" name="Dinheiro do Bolso" stackId="a" fill="#94a3b8" />
                      <Bar dataKey="juros" name="Juros Compostos" stackId="a" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl p-10">
              <TrendingUp className="w-16 h-16 mb-4 opacity-20" />
              <p>Preencha os dados ao lado e clique em Simular para ver a mágica acontecer.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}