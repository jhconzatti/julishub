import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import Header from "./components/Header";
import Footer from "./components/Footer";

// Importação das Páginas
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Markets from "./views/Markets";
import Calculators from "./views/Calculators";
import Stocks from "./views/Stocks";
import Indicators from "./views/Indicators";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-background font-sans antialiased">
          
          {/* Header */}
          <Header />
          
          {/* CORREÇÃO AQUI: Adicionado 'container mx-auto px-4' para alinhar com cabeçalho */}
          <main className="flex-1 container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/calculators" element={<Calculators />} />
              <Route path="/stocks" element={<Stocks />} />
              <Route path="/indicators" element={<Indicators />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          {/* Footer */}
          <Footer />
          
        </div>
        
        <Toaster />
        <Sonner />
      </BrowserRouter>
      <Analytics />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;