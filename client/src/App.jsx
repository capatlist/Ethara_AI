import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tasks from './pages/Tasks';
import Team from './pages/Team';

function AuthRedirect({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
          <Route path="/register" element={<AuthRedirect><Register /></AuthRedirect>} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="team" element={<Team />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ className: 'toast-custom', duration: 3000, style: { background: '#131829', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.06)' } }} />
    </AuthProvider>
  );
}

export default App;
