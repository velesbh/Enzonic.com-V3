import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemedClerkProvider } from "@/components/ThemedClerkProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import SearchResults from "./pages/SearchResults";
import About from "./pages/About";
import Admin from "./pages/Admin";
import Support from "./pages/Support";
import Translate from "./pages/Translate";
import Chatbot from "./pages/Chatbot";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Boxes from "./pages/Boxes";
import Emi from "./pages/Emi";
import Shows from "./pages/Shows";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="enzonic-ui-theme">
        <ThemedClerkProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="overflow-x-hidden">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/translate" element={<Translate />} />
                  <Route path="/chatbot" element={<Chatbot />} />
                  <Route path="/boxes" element={<Boxes />} />
                  <Route path="/emi" element={<Emi />} />
                  <Route path="/shows" element={<Shows />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </ThemedClerkProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
