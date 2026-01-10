import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { TrendingUp, Activity, Calculator, Home, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const navItems = [
    { path: '/', label: t('nav.home') || 'Inicial', icon: Home },
    { path: '/markets', label: t('nav.markets') || 'Mercados', icon: TrendingUp },
    { path: '/indicators', label: t('nav.indicators') || 'Indicadores', icon: Activity },
    { path: '/calculators', label: t('nav.calculators') || 'Calculadoras', icon: Calculator },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>Menu de Navegação</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 mt-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-base font-medium
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
