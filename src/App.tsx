import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/lib/theme";
import { queryClient } from "@/lib/queryClient";
import { AppShell } from "@/components/layout/AppShell";
import Index from "./pages/Index";

// Every page except the home page is code-split (audit P1).
const Listing = lazy(() => import("./pages/Listing"));
const PostPage = lazy(() => import("./pages/PostPage"));
const MyJobs = lazy(() => import("./pages/MyJobs"));
const Today = lazy(() => import("./pages/Today"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const Newsletter = lazy(() => import("./pages/Newsletter"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const MobileElectronicsPage = lazy(() => import("./pages/MobileElectronicsPage"));
const MatajiStudioPage = lazy(() => import("./pages/MatajiStudioPage"));
const About = lazy(() => import("./pages/About"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPosts = lazy(() => import("./pages/admin/AdminPosts"));
const PostEditor = lazy(() => import("./pages/admin/PostEditor"));
const AdminModeration = lazy(() => import("./pages/admin/AdminModeration"));
const AdminQuiz = lazy(() => import("./pages/admin/AdminQuiz"));
const AdminCatalog = lazy(() => import("./pages/admin/AdminCatalog"));

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                  <Route element={<AppShell />}>
                    <Route index element={<Index />} />
                    <Route path="jobs" element={<Listing kind="jobs" />} />
                    <Route path="admit-card" element={<Listing kind="admit" />} />
                    <Route path="result" element={<Listing kind="result" />} />
                    <Route path="blog" element={<Listing kind="all" />} />
                    <Route path="blog/:identifier" element={<PostPage />} />
                    <Route path="today" element={<Today />} />
                    <Route path="quiz" element={<Quiz />} />
                    <Route path="my" element={<MyJobs />} />
                    <Route path="login" element={<Login />} />
                    <Route path="auth/reset" element={<ResetPassword />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="newsletter" element={<Newsletter />} />
                    <Route path="services" element={<ServicesPage />} />
                    <Route path="mobile-electronics" element={<MobileElectronicsPage />} />
                    <Route path="mataji-studio" element={<MatajiStudioPage />} />
                    <Route path="about" element={<About />} />
                    <Route path="privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="terms" element={<Terms />} />
                    <Route path="admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="posts" element={<AdminPosts />} />
                      <Route path="posts/new" element={<PostEditor key="new" />} />
                      <Route path="posts/:id" element={<PostEditor />} />
                      <Route path="moderation" element={<AdminModeration />} />
                      <Route path="quiz" element={<AdminQuiz />} />
                      <Route path="catalog" element={<AdminCatalog />} />
                    </Route>
                    <Route path="home" element={<Navigate to="/" replace />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
              </Routes>
              <Toaster />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
