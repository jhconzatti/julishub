import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import { Footer } from "./components/Footer"; // Importe o Footer aqui

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
        <div className="flex min-h-screen flex-col">
          {/* Header fica FORA das Routes para aparecer em todas as páginas */}
          <Header />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/calculators" element={<Calculators />} />
              <Route path="/stocks" element={<Stocks />} />
              <Route path="/indicators" element={<Indicators />} />
              {/* Rota de erro 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          {/* Footer fica FORA das Routes */}
          <Footer />
        </div>
        
        <Toaster />
        <Sonner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;