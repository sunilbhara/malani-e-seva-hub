import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Index from "./pages/Index";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import { AuthProvider } from "./hooks/useAuth";
import GoogleAnalytics from "./utils/GoogleAnalytics";
import { loadAdsenseScript } from "./utils/LoadAdsence";

const queryClient = new QueryClient();
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const MobileElectronicsPage = lazy(() => import("./pages/MobileElectronicsPage"));
const MatajiStudioPage = lazy(() => import("./pages/MatajiStudioPage"));

const App = () => {
  useEffect(() => {
    loadAdsenseScript();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <ToastContainer position="top-right" autoClose={3200} theme="colored" newestOnTop />
          <AuthProvider>
            <GoogleAnalytics />

            <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 pt-28 text-center text-gray-600">Loading...</div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/mobile-electronics" element={<MobileElectronicsPage />} />
                <Route path="/mataji-studio" element={<MatajiStudioPage />} />

                {/* Blog system */}
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:identifier" element={<BlogPost />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<Admin />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
