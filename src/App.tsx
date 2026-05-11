import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlockedBanner from "@/components/BlockedBanner";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import SubmitIdea from "@/pages/SubmitIdea";
import Marketplace from "@/pages/Marketplace";
import IdeaDetail from "@/pages/IdeaDetail";
import AiChat from "@/pages/AiChat";
import ChatWithFounder from "@/pages/ChatWithFounder";
import KycVerification from "@/pages/KycVerification";
import MyDeals from "@/pages/MyDeals";
import Admin from "@/pages/Admin";
import VerifyPhone from "@/pages/VerifyPhone";
import Payment from "@/pages/Payment";
import PaymentResult from "@/pages/PaymentResult";
import NotFound from "@/pages/NotFound";
import PageTransition from "@/components/PageTransition";

const queryClient = new QueryClient();


function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/submit" element={<PageTransition><SubmitIdea /></PageTransition>} />
        <Route path="/marketplace" element={<PageTransition><Marketplace /></PageTransition>} />
        <Route path="/idea/:id" element={<PageTransition><IdeaDetail /></PageTransition>} />
        <Route path="/chat" element={<PageTransition><AiChat /></PageTransition>} />
        <Route path="/chat-founder/:founderId" element={<PageTransition><ChatWithFounder /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/kyc" element={<PageTransition><KycVerification /></PageTransition>} />
        <Route path="/verify-phone" element={<PageTransition><VerifyPhone /></PageTransition>} />
        <Route path="/deals" element={<PageTransition><MyDeals /></PageTransition>} />
        <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
        <Route path="/payment/:dealId" element={<PageTransition><Payment /></PageTransition>} />
        <Route path="/payment-result" element={<PageTransition><PaymentResult /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Navbar />
              <AnimatedRoutes />
              <Footer />
              <BlockedBanner />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
