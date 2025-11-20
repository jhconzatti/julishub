import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, LineChart, Activity, Calculator } from 'lucide-react';

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Navigation = ({ activeView, onViewChange }: NavigationProps) => {
  const { t } = useTranslation();

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <Tabs value={activeView} onValueChange={onViewChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-transparent">
            <TabsTrigger
              value="markets"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.markets')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="stocks"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.stocks')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="indicators"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.indicators')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="calculators"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.calculators')}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </nav>
  );
};

export default Navigation;
