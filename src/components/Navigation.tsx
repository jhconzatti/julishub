import { useTranslation } from 'react-i18next';
import { TrendingUp, LineChart, Activity, Calculator } from 'lucide-react';

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Navigation = ({ activeView, onViewChange }: NavigationProps) => {
  const { t } = useTranslation();

  const navItems = [
    { id: 'markets', label: t('nav.markets'), icon: TrendingUp },
    { id: 'stocks', label: t('nav.stocks'), icon: LineChart },
    { id: 'indicators', label: t('nav.indicators'), icon: Activity },
    { id: 'calculators', label: t('nav.calculators'), icon: Calculator },
  ];

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
