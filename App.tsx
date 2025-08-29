
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AffiliateDashboard from './pages/affiliate/AffiliateDashboard';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-primary-500 border-dashed rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <Navigate to="/" />} />
        <Route
          path="/*"
          element={
            user ? (
              user.role === 'Admin' ? <AdminDashboard /> : <AffiliateDashboard />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </HashRouter>
  );
};

export default App;