import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Code } from "lucide-react";
import { useLang } from '@/hooks/use-lang';
import { openCookieConsentPreferences } from '@/lib/cookieConsent';

export const Footer = () => {
  const { t } = useTranslation();
  const { lp } = useLang();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background py-12 border-t border-border/40">
      {/* CORREÇÃO AQUI: Mudado de 'max-w-5xl' para 'container' */}
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-2 text-center md:items-start md:text-left">
            <p>
              &copy; {currentYear} JulisHub. {t('footer.rights')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 md:justify-start">
              <Link
                to={lp('/privacy')}
                className="text-xs font-medium text-muted-foreground transition-colors duration-300 hover:text-primary hover:underline underline-offset-4"
              >
                {t('footer.privacy')}
              </Link>
              <button
                type="button"
                onClick={openCookieConsentPreferences}
                className="text-xs font-medium text-muted-foreground transition-colors duration-300 hover:text-primary hover:underline underline-offset-4"
              >
                {t('footer.cookies')}
              </button>
            </div>
          </div>
          
          <a 
            href="https://julianoconzatti.vercel.app/pt" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-primary transition-colors duration-300 group"
          >
            <Code size={16} className="text-muted-foreground group-hover:text-primary group-hover:rotate-12 transition-all duration-300" />
            <span>
              {t('footer.developedBy')} <span className="font-semibold text-foreground group-hover:text-primary transition-colors">Juliano Conzatti</span>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;