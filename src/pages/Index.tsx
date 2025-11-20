import { useState } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import Markets from '@/views/Markets';
import Stocks from '@/views/Stocks';
import Indicators from '@/views/Indicators';
import Calculators from '@/views/Calculators';
import '@/lib/i18n';

const Index = () => {
  const [activeView, setActiveView] = useState('markets');

  const renderView = () => {
    switch (activeView) {
      case 'markets':
        return <Markets />;
      case 'stocks':
        return <Stocks />;
      case 'indicators':
        return <Indicators />;
      case 'calculators':
        return <Calculators />;
      default:
        return <Markets />;
    }
  };

  return (
    <ThemeProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <main className="container mx-auto flex-1 px-4 py-8">
          {renderView()}
        </main>
      </div>
    </ThemeProvider>
  );
};

export default Index;
