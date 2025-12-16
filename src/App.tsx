import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import ListingDetail from "./pages/ListingDetail";
import PainelIndex from "./pages/painel/Index";
import PainelItens from "./pages/painel/Itens";
import NovoItem from "./pages/painel/NovoItem";
import EditarItem from "./pages/painel/EditarItem";
import AdminModeracao from "./pages/admin/Moderacao";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/item/:id" element={<ListingDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            
            {/* Advertiser panel routes - Protected */}
            <Route path="/painel" element={<ProtectedRoute><PainelIndex /></ProtectedRoute>} />
            <Route path="/painel/itens" element={<ProtectedRoute><PainelItens /></ProtectedRoute>} />
            <Route path="/painel/novo-item" element={<ProtectedRoute><NovoItem /></ProtectedRoute>} />
            <Route path="/painel/editar/:id" element={<ProtectedRoute><EditarItem /></ProtectedRoute>} />
            
            {/* Admin routes - Admin/Moderator only */}
            <Route path="/admin/moderacao" element={<AdminRoute><AdminModeracao /></AdminRoute>} />
            
            {/* Redirects for old routes */}
            <Route path="/auth" element={<Navigate to="/login" replace />} />
            <Route path="/listing/:id" element={<Navigate to="/item/:id" replace />} />
            <Route path="/dashboard" element={<Navigate to="/painel" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/moderacao" replace />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
