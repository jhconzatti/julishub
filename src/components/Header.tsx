import Navigation from "./Navigation"; 
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, Wallet, Languages } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();

  // Função para trocar idioma
  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* O container aqui garante o alinhamento com o resto do site */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* 1. Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="hidden sm:inline-block">JulisHub</span>
        </Link>

        {/* 2. Navegação Central */}
        <div className="hidden md:flex">
            <Navigation />
        </div>

        {/* 3. Ações (Tema + Idioma) */}
        <div className="flex items-center gap-2">
          
          {/* Seletor de Idioma (Dropdown para economizar espaço) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" title="Alterar Idioma">
                <Languages className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLanguage('pt-BR')}>
                🇧🇷 Português
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('en')}>
                🇺🇸 English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('es')}>
                🇦🇷 Español
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botão de Tema */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
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