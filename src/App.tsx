// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginForm } from './components/Auth/LoginForm';
import { SignupForm } from './components/Auth/SignupForm';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Calls } from './pages/Calls';
import { CallDetails } from './pages/CallDetails';
import { Leaderboard } from './pages/Leaderboard';
import { TeamManagement } from './pages/TeamManagement';
import { Goals } from './pages/Goals';
import { PlaybookPage } from './pages/Playbook';
import { CoachingHub } from './pages/CoachingHub';
import { Toaster } from 'react-hot-toast';

// Layout para rotas autenticadas
const PrivateLayout = () => (
  <div className="flex h-screen bg-background">
    <Sidebar />
    <main className="flex-1 overflow-y-auto">
      <Outlet />
    </main>
  </div>
);

// Componente que define as rotas da aplicação
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      {!user ? (
        // Rotas públicas (sem autenticação)
        <>
          <Route path="/" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        // Rotas privadas (autenticadas)
        <Route element={<PrivateLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/call/:callId" element={<CallDetails />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/playbook" element={<PlaybookPage />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/coaching" element={<CoachingHub />} />
          {user.role === 'administrator' && (
            <>
              <Route path="/team" element={<TeamManagement />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      )}
    </Routes>
  );
}

// Componente principal que provê o contexto de autenticação
function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;