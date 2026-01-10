import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'pt-BR';

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex gap-1 sm:gap-2 bg-secondary/30 p-1 sm:p-1.5 rounded-full border border-border/50 backdrop-blur-sm">
      <TooltipProvider>
        {/* Português - Brasil */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeLanguage('pt-BR')}
              className={`w-8 h-8 rounded-full transition-all hover:bg-background/80 ${
                currentLang === 'pt-BR' 
                  ? 'bg-background shadow-sm ring-2 ring-primary/20 grayscale-0 scale-110' 
                  : 'grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:scale-105'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 50" className="w-6 h-6 rounded-sm shadow-sm">
                <rect width="72" height="50" fill="#009c3b"/>
                <polygon points="36,6 66,25 36,44 6,25" fill="#ffdf00"/>
                <circle cx="36" cy="25" r="12" fill="#002776"/>
                <path d="M12,25c0,0,10,5,24,0s24,0,24,0" stroke="#fff" strokeWidth="1.5" fill="none"/>
              </svg>
              <span className="sr-only">Português</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Português (Brasil)</TooltipContent>
        </Tooltip>

        {/* Inglês - EUA */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeLanguage('en')}
              className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full transition-all hover:bg-background/80 ${
                currentLang === 'en' 
                  ? 'bg-background shadow-sm ring-2 ring-primary/20 grayscale-0 scale-110' 
                  : 'grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:scale-105'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 50" className="w-6 h-6 rounded-sm shadow-sm">
                <rect width="72" height="50" fill="#b22234"/>
                <path d="M0,0h72v3.8H0zm0,7.7h72v3.8H0zm0,7.7h72v3.8H0zm0,7.7h72v3.8H0zm0,7.7h72v3.8H0zm0,7.7h72v3.8H0zm0,7.7h72v3.8H0z" fill="#fff"/>
                <path d="M0,0h72v3.8H0zm0,7.7h72v3.8H0zm0,7.7h72v3.8H0zm0,7.7h72v3.8H0zm0,7.7h72v3.8H0zm0,7.7h72v3.8H0z" fill="#b22234"/>
                <rect width="28" height="27" fill="#3c3b6e"/>
                <path d="M2,2h2v2H2zm4,0h2v2H6zm4,0h2v2h-2zm4,0h2v2h-2zm4,0h2v2h-2zm4,0h2v2h-2z" fill="#fff"/>
                <path d="M4,6h2v2H4zm4,0h2v2H8zm4,0h2v2h-2zm4,0h2v2h-2zm4,0h2v2h-2z" fill="#fff"/>
                <path d="M2,10h2v2H2zm4,0h2v2H6zm4,0h2v2h-2zm4,0h2v2h-2zm4,0h2v2h-2zm4,0h2v2h-2z" fill="#fff"/>
                <path d="M4,14h2v2H4zm4,0h2v2H8zm4,0h2v2h-2zm4,0h2v2h-2zm4,0h2v2h-2z" fill="#fff"/>
                <path d="M2,18h2v2H2zm4,0h2v2H6zm4,0h2v2h-2zm4,0h2v2h-2zm4,0h2v2h-2zm4,0h2v2h-2z" fill="#fff"/>
                <path d="M4,22h2v2H4zm4,0h2v2H8zm4,0h2v2h-2zm4,0h2v2h-2zm4,0h2v2h-2z" fill="#fff"/>
              </svg>
              <span className="sr-only">English</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>English (USA)</TooltipContent>
        </Tooltip>

        {/* Espanhol - Argentina */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeLanguage('es')}
              className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full transition-all hover:bg-background/80 ${
                currentLang === 'es' 
                  ? 'bg-background shadow-sm ring-2 ring-primary/20 grayscale-0 scale-110' 
                  : 'grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:scale-105'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 50" className="w-6 h-6 rounded-sm shadow-sm">
                <rect width="72" height="16.6" fill="#75aadb"/>
                <rect y="16.6" width="72" height="16.6" fill="#fff"/>
                <rect y="33.2" width="72" height="16.8" fill="#75aadb"/>
                <circle cx="36" cy="25" r="6" fill="#f6b40e"/>
                <g fill="#f6b40e" stroke="#8b5a00" strokeWidth="0.5">
                  <path d="M35,21l0.5,1.5h1.5l-1.2,1l0.5,1.5l-1.3-0.9l-1.3,0.9l0.5-1.5l-1.2-1h1.5z"/>
                  <path d="M39,23l0.3,1h1l-0.8,0.6l0.3,1l-0.8-0.6l-0.8,0.6l0.3-1l-0.8-0.6h1z"/>
                  <path d="M33,23l0.3,1h1l-0.8,0.6l0.3,1l-0.8-0.6l-0.8,0.6l0.3-1l-0.8-0.6h1z"/>
                </g>
              </svg>
              <span className="sr-only">Español</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Español (Argentina)</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
