import { NavLink } from 'react-router-dom';
import { TrendingUp, Activity, Calculator, Home, Newspaper, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Navigation = () => {
  // Usando o nosso contexto personalizado criado anteriormente
  const { t } = useTranslation();

  const navItems = [
    { path: '/', label: t('nav.home') || 'Inicial', icon: Home },
    { path: '/markets', label: t('nav.markets') || 'Mercados', icon: TrendingUp },
    { path: '/indicators', label: t('nav.indicators') || 'Indicadores', icon: Activity },
    { path: '/calculators', label: t('nav.calculators') || 'Calculadoras', icon: Calculator },
    { path: '/news', label: t('nav.news') || 'Notícias', icon: Newspaper },
    { path: '/blog', label: t('nav.blog') || 'Blog', icon: BookOpen },
  ];

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium
              ${isActive 
                ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }
            `}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
          
        );
      })}
    </nav>
  );
};

export default Navigation;