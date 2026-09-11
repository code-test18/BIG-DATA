import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import type { Role } from '../services/authService';

interface RequireRoleProps {
  allowed: Role[];
  children: ReactNode;
}

function RequireRole({ allowed, children }: RequireRoleProps) {
  const usuario = getCurrentUser();

  if (!usuario) return <Navigate to="/login" replace />;
  if (!allowed.includes(usuario.role)) return <Navigate to="/dashboard/inicio" replace />;

  return <>{children}</>;
}

export default RequireRole;