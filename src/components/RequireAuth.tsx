import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/api';
import { LoadingBlock } from './ui/Primitives';

export function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const home = user?.role === 'student' ? '/app' : '/admin';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <LoadingBlock label="Checking your session…" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  if (!user.mustChangePassword && location.pathname === '/change-password') {
    return <Navigate to={home} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={home} replace />;
  }
  return <>{children}</>;
}
