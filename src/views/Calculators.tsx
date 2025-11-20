import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, DollarSign, Briefcase, TrendingUp, PiggyBank, Percent, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const Calculators = () => {
  const { t } = useTranslation();
  const [activeCalculator, setActiveCalculator] = useState<string>('cltSalary');
  const [grossSalary, setGrossSalary] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const calculators = [
    {
      id: 'cltSalary',
      title: t('calculators.cltSalary'),
      icon: DollarSign,
      description: 'Calculate your net salary after taxes and deductions',
    },
    {
      id: 'cltVacation',
      title: t('calculators.cltVacation'),
      icon: Briefcase,
      description: 'Calculate your vacation pay',
    },
    {
      id: 'thirteenth',
      title: t('calculators.thirteenth'),
      icon: Calculator,
      description: 'Calculate your 13th salary',
    },
    {
      id: 'financialIndependence',
      title: t('calculators.financialIndependence'),
      icon: TrendingUp,
      description: 'Calculate how much you need to achieve financial independence',
    },
    {
      id: 'pgblVgbl',
      title: t('calculators.pgblVgbl'),
      icon: PiggyBank,
      description: 'Compare PGBL vs VGBL retirement plans',
    },
    {
      id: 'fixedIncome',
      title: t('calculators.fixedIncome'),
      icon: Percent,
      description: 'Calculate returns on fixed income investments',
    },
  ];

  const handleCalculate = () => {
    const salary = parseFloat(grossSalary);
    if (isNaN(salary) || salary <= 0) {
      toast.error('Please enter a valid salary');
      return;
    }

    // Simple calculation example (CLT Net Salary)
    const inss = salary * 0.11; // 11% INSS
    const irrf = salary * 0.075; // 7.5% IRRF (simplified)
    const netSalary = salary - inss - irrf;

    setResult(
      `Gross Salary: R$ ${salary.toFixed(2)}\nINSS: R$ ${inss.toFixed(
        2
      )}\nIRRF: R$ ${irrf.toFixed(2)}\nNet Salary: R$ ${netSalary.toFixed(2)}`
    );
  };

  const activeCalcData = calculators.find((c) => c.id === activeCalculator);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Sidebar Menu */}
      <aside className="lg:w-1/3 space-y-2">
        {calculators.map((calc) => {
          const Icon = calc.icon;
          const isActive = activeCalculator === calc.id;

          return (
            <button
              key={calc.id}
              onClick={() => {
                setActiveCalculator(calc.id);
                setResult(null);
                setGrossSalary('');
              }}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 text-left ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-card hover:bg-muted/50 text-foreground border border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? 'text-primary-foreground' : 'text-primary'
                  }`}
                />
                <span className="font-medium">{calc.title}</span>
              </div>
              {isActive && <ArrowRight className="h-5 w-5" />}
            </button>
          );
        })}
      </aside>

      {/* Content Area */}
      <div className="lg:w-2/3">
        <Card className="rounded-xl border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              {activeCalcData && (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <activeCalcData.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{activeCalcData.title}</CardTitle>
                    <CardDescription>{activeCalcData.description}</CardDescription>
                  </div>
                </>
              )}
            </div>
          </CardHeader>

          {activeCalculator === 'cltSalary' && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="grossSalary">Gross Monthly Salary (R$)</Label>
                <Input
                  id="grossSalary"
                  type="number"
                  placeholder="5000.00"
                  value={grossSalary}
                  onChange={(e) => setGrossSalary(e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <Button onClick={handleCalculate} className="w-full rounded-lg">
                <Calculator className="mr-2 h-4 w-4" />
                {t('calculators.calculate')}
              </Button>
              {result && (
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <h3 className="mb-2 font-semibold">{t('calculators.result')}</h3>
                  <pre className="whitespace-pre-wrap text-sm">{result}</pre>
                </div>
              )}
            </CardContent>
          )}

          {activeCalculator !== 'cltSalary' && (
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Calculator under development
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Calculators;
