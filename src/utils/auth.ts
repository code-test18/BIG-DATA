import type { AuthUser, Role } from '../services/authService';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Solo se usa si no hay sesión real guardada (ej. probando componentes sueltos
// sin pasar por el login). Déjalo en null una vez que pruebes con el backend real.
const ROL_SIMULADO_PARA_PRUEBAS: Role | null = null;

export function guardarSesion(token: string, user: AuthUser): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function cerrarSesion(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): AuthUser | null {
  const raw = sessionStorage.getItem(USER_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      // sigue al fallback de abajo
    }
  }

  const token = getToken();
  if (token) {
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson);
      if (payload.email) {
        return { id: payload.userId ?? payload.id, name: payload.name ?? '', email: payload.email, role: payload.role };
      }
    } catch {
      // sigue al fallback de abajo
    }
  }

  if (ROL_SIMULADO_PARA_PRUEBAS) {
    return { id: 'dev-user', name: 'Usuario de prueba', email: 'dev@test.com', role: ROL_SIMULADO_PARA_PRUEBAS };
  }

  return null;
}