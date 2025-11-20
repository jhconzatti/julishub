import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, DollarSign, Briefcase, TrendingUp, PiggyBank, Percent } from 'lucide-react';
import { toast } from 'sonner';

const Calculators = () => {
  const { t } = useTranslation();
  const [activeCalculator, setActiveCalculator] = useState<string | null>(null);
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {calculators.map((calc) => {
          const Icon = calc.icon;
          const isActive = activeCalculator === calc.id;

          return (
            <Card
              key={calc.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isActive ? 'border-primary ring-2 ring-primary' : ''
              }`}
              onClick={() =>
                setActiveCalculator(isActive ? null : calc.id)
              }
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{calc.title}</CardTitle>
                </div>
                <CardDescription>{calc.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {activeCalculator === 'cltSalary' && (
        <Card>
          <CardHeader>
            <CardTitle>CLT Net Salary Calculator</CardTitle>
            <CardDescription>
              Enter your gross monthly salary to calculate your net salary
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grossSalary">Gross Monthly Salary (R$)</Label>
              <Input
                id="grossSalary"
                type="number"
                placeholder="5000.00"
                value={grossSalary}
                onChange={(e) => setGrossSalary(e.target.value)}
              />
            </div>
            <Button onClick={handleCalculate} className="w-full">
              {t('calculators.calculate')}
            </Button>
            {result && (
              <div className="rounded-lg border border-border bg-muted p-4">
                <h3 className="mb-2 font-semibold">{t('calculators.result')}</h3>
                <pre className="whitespace-pre-wrap text-sm">{result}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Calculators;
