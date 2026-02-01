import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import SubscriptionProtectedRoute from './components/SubscriptionProtectedRoute';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuthConfirm from './pages/AuthConfirm';
import MetaCallback from './pages/MetaCallback';
import MetaSelect from './pages/MetaSelect';
import Brief from './pages/Brief';
import Dashboard from './pages/Dashboard';
// import NewDashboard from './pages/NewDashboard';
import ProductionDashboard from './pages/ProductionDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Payment from './pages/Payment';

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <img src="/logo-new.png" alt="Logo" className="w-16 h-16 rounded-full object-contain mx-auto mb-4" />
          <div className="text-2xl font-bold text-red-600">The Ad Agent</div>
          <div className="text-gray-400 mt-2">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/confirm" element={<AuthConfirm />} />
      <Route path="/meta-callback" element={<MetaCallback />} />
      <Route
        path="/meta-select"
        element={
          <ProtectedRoute>
            <MetaSelect />
          </ProtectedRoute>
        }
      />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/payment" element={<Payment />} />
      <Route
        path="/brief"
        element={
          <ProtectedRoute>
            <Brief />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <SubscriptionProtectedRoute>
            <ProductionDashboard />
          </SubscriptionProtectedRoute>
        }
      />
      <Route
        path="/dashboard-old"
        element={
          <SubscriptionProtectedRoute>
            <Dashboard />
          </SubscriptionProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
