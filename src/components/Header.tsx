import Navigation from "./Navigation"; 
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* 1. Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="hidden sm:inline-block">JulisHub</span>
        </Link>

        {/* 2. Navegação (Agora autônoma, sem props) */}
        <div className="hidden md:flex">
            <Navigation />
        </div>

        {/* 3. Ações */}
        <div className="flex items-center gap-2">
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
              <Moon className="h-5 w-5 text-slate-700 transition-all" />
            )}
          </Button>
        </div>

      </div>
    </header>
  );
};

// MUDANÇA CRUCIAL AQUI: Export Default
export default Header;