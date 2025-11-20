import { useTranslation } from 'react-i18next';
import { Code } from "lucide-react";

export const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background py-12 border-t border-border/40">
      {/* CORREÇÃO AQUI: Mudado de 'max-w-5xl' para 'container' */}
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>
            &copy; {currentYear} JulisHub. {t('footer.rights')}
          </p>
          
          <a 
            href="https://julianoconzatti.vercel.app/" 
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