import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isSubscribed, hasBrief } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const currentPath = location.pathname;

  // /subscription → user must be subscribed to leave this page
  if (currentPath === '/subscription') {
    if (isSubscribed) {
      return <Navigate to="/brief" replace />;
    }
    return <>{children}</>;
  }

  // /brief → user must have subscription
  if (currentPath === '/brief') {
    if (!isSubscribed) {
      return <Navigate to="/subscription" replace />;
    }
    if (hasBrief) {
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  // /dashboard → user must be authenticated, subscribed, and completed brief
  if (currentPath === '/dashboard') {
    if (!isSubscribed) {
      return <Navigate to="/#pricing" replace />;
    }
    if (!hasBrief) {
      return <Navigate to="/brief" replace />;
    }
    return <>{children}</>;
  }

  // /checkout → authenticated users only
  if (currentPath === '/checkout') {
    if (isSubscribed && hasBrief) {
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  return <>{children}</>;
}
