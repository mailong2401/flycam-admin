import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/admin/ProtectedRoute";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import BlogManagement from "./pages/admin/BlogManagement";
import BlogNew from "./pages/admin/BlogNew";
import BlogEdit from "./pages/admin/BlogEdit";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Route /admin - Protected và redirect đến dashboard */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <Navigate to="/admin/dashboard" replace />
                  </ProtectedRoute>
                } 
              />
              
              {/* Route /admin/login - CŨNG được bảo vệ bởi ProtectedRoute */}
              <Route 
                path="/admin/login" 
                element={
                  <ProtectedRoute>
                    <AdminLogin />
                  </ProtectedRoute>
                } 
              />
              
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/admin/blog"
                element={
                  <ProtectedRoute>
                    <BlogManagement />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/admin/blog/new"
                element={
                  <ProtectedRoute>
                    <BlogNew />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/admin/blog/edit/:id"
                element={
                  <ProtectedRoute>
                    <BlogEdit />
                  </ProtectedRoute>
                }
              />
              
              <Route path="/" element={<Navigate to="/admin/login" replace />} />
              <Route path="*" element={<Navigate to="/admin/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;