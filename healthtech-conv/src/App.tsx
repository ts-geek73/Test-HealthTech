import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import DashboardPage from "./pages/dashboard";
import NotFound from "./pages/NotFound";
import SessionDetailPage from "./pages/session-detail";
import ContentRedirectPage from "./pages/content/[id]";
import { DraftProvider } from "./providers/DraftProvider";

function App() {
  const isInIframe = window.self !== window.top;

  if (isInIframe) {
    console.log("App is running inside an iframe");
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DraftProvider>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/session/:id" element={<SessionDetailPage />} />
            {/* new dynamic content route - creates a session in the background and then
                navigates to the resulting session detail page */}
          <Route path="/content/:id" element={<ContentRedirectPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DraftProvider>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
