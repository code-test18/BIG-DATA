import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import type { AuthUser, Role } from './services/authService';
import { guardarSesion } from './utils/auth';

function leerUsuarioDesdeToken(token: string, rolUrl: string | null, userIdUrl: string | null): AuthUser | null {
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as {
      userId?: string;
      id?: string;
      name?: string;
      email?: string;
      rol?: string;
      role?: string;
    };
    const role = (payload.role ?? payload.rol ?? rolUrl)?.toUpperCase();

    if (!payload.email || (role !== 'ANALISTA' && role !== 'TRABAJADOR')) return null;

    return {
      id: payload.userId ?? payload.id ?? userIdUrl ?? '',
      name: payload.name ?? payload.email,
      email: payload.email,
      role: role as Role,
    };
  } catch {
    return null;
  }
}

function App() {
  const [procesandoAcceso, setProcesandoAcceso] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      const user = leerUsuarioDesdeToken(token, params.get('rol'), params.get('userId'));
      if (user) {
        guardarSesion(token, user);
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate('/dashboard/inicio', { replace: true });
      }
    }

    setProcesandoAcceso(false);
  }, [navigate]);

  if (procesandoAcceso) return <div className="p-4 text-center">Verificando acceso...</div>;

  return <AppRoutes />;
}
export default App;