// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/Auth/LoginForm';
import { SignupForm } from './components/Auth/SignupForm';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import Calls from './pages/Calls';
import { CallDetails } from './pages/CallDetails';
import { Leaderboard } from './pages/Leaderboard';
import { TeamManagement } from './pages/TeamManagement';
import { Extension } from './pages/Extension';

const PrivateRoutes = () => (
  <div className="flex h-screen bg-gray-100">
    <Sidebar />
    <main className="flex-1 overflow-y-auto">
      <Outlet /> 
    </main>
  </div>
);

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {!user ? (
          <>
            <Route path="/" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route element={<PrivateRoutes />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/calls" element={<Calls />} />
              <Route path="/call/:callId" element={<CallDetails />} />
              <Route path="/extension" element={<Extension />} />

              {/* Rotas exclusivas do Administrador */}
              {user.role === 'administrator' && (
                <>
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/team" element={<TeamManagement />} />
                </>
              )}
            </Route>
            {/* Redireciona qualquer outra rota para o dashboard se estiver logado */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;