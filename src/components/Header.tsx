import Navigation from "./Navigation"; 
import MobileNav from "./MobileNav";
import { LanguageToggle } from "./LanguageToggle";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* O container aqui garante o alinhamento com o resto do site */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* 1. Menu Mobile (Hamburger) + Logo */}
        <div className="flex items-center gap-3">
          <MobileNav />
          <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="hidden sm:inline-block">JulisHub</span>
          </Link>
        </div>

        {/* 2. Navegação Central */}
        <div className="hidden md:flex">
            <Navigation />
        </div>

        {/* 3. Ações (Idioma + Tema) */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-border/50">
          {/* Seletor de Idioma */}
          <LanguageToggle />

          {/* Botão de Tema */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-10 h-10 sm:w-9 sm:h-9"
            title="Alternar Tema"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-orange-400 transition-all" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700 dark:text-slate-200 transition-all" />
            )}
          </Button>
        </div>

      </div>
    </header>
  );
};

export default Header;