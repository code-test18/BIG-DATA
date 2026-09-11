const API_URL = import.meta.env.VITE_API_URL || 'https://backend-api-production-6a5a.up.railway.app';

export type Role = 'ANALISTA' | 'TRABAJADOR';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginSimulado {
  user: AuthUser;
  token: string;
}

const USUARIOS_SIMULADOS: Array<{ email: string; password: string; user: AuthUser }> = [
  {
    email: 'analistabigdata2@gmail.com',
    password: '12345678',
    user: {
      id: 'simulado-analista',
      name: 'Analista Big Data',
      email: 'analistabigdata2@gmail.com',
      role: 'ANALISTA',
    },
  },
  {
    email: 'roxana@gmail.com',
    password: '12345678',
    user: {
      id: 'simulado-trabajador',
      name: 'Roxana',
      email: 'roxana@gmail.com',
      role: 'TRABAJADOR',
    },
  },
];

export function loginSimulado(email: string, password: string): LoginSimulado | null {
  const usuario = USUARIOS_SIMULADOS.find(
    (item) => item.email === email.trim().toLowerCase() && item.password === password,
  );

  if (!usuario) return null;

  return {
    user: usuario.user,
    token: usuario.user.role === 'ANALISTA'
      ? import.meta.env.VITE_ANALISTA_TOKEN ?? ''
      : 'token-simulado',
  };
}

export interface LoginOtpEnviado {
  tipo: 'otp_enviado';
  userId: string; // TODO: confirmar que el backend efectivamente devuelve esto para el Analista
}

export interface LoginPendienteAprobacion {
  tipo: 'pendiente_aprobacion';
  loginRequestId: string;
  userId: string;
  email: string;
  message: string;
}

export type LoginResult = LoginOtpEnviado | LoginPendienteAprobacion;

export type EstadoLoginRequest = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'EXPIRADA';

interface EstadoResponseApi {
  estado: EstadoLoginRequest;
  userId?: string;
  id?: string;
  usuarioId?: string;
  user?: { id?: string };
}

export interface EstadoResponse {
  estado: EstadoLoginRequest;
  userId?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<{ status: number; data: T }> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // sin body
  }

  if (!res.ok) {
    const message = (data as { message?: string } | null)?.message || `Error ${res.status}`;
    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return { status: res.status, data: data as T };
}

/** POST /auth/login — mismo endpoint para Analista y Trabajador; el status HTTP distingue el flujo */
export async function login(email: string, password: string): Promise<LoginResult> {
  const { status, data } = await request<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (status === 202) {
    return {
      tipo: 'pendiente_aprobacion',
      loginRequestId: data.loginRequestId,
      userId: data.userId,
      email: data.email,
      message: data.message,
    };
  }

  return { tipo: 'otp_enviado', userId: data.userId };
}

/** GET /auth/login-requests/:id/estado?email=... */
export function consultarEstadoLoginRequest(loginRequestId: string, email: string): Promise<EstadoResponse> {
  return request<EstadoResponseApi>(
    `/auth/login-requests/${loginRequestId}/estado?email=${encodeURIComponent(email)}`,
    { method: 'GET' },
  ).then((r) => {
    const data = r.data;
    return {
      estado: data.estado,
      userId: data.userId ?? data.user?.id ?? data.usuarioId ?? data.id,
    };
  });
}

/** POST /auth/verify-otp */
export function verifyOtp(userId: string, code: string): Promise<{ token: string; user: AuthUser }> {
  return request<{ token: string; user: AuthUser }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ userId, code }),
  }).then((r) => r.data);
}

/** POST /auth/resend-otp — TODO: confirmar el body exacto, aquí asumo { email } */
export function resendOtp(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }).then((r) => r.data);
}

export function register(input: { name: string; email: string; password: string }): Promise<unknown> {
  return request<unknown>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => r.data);
}

// Compatibilidad con las vistas que todavía usan el objeto de servicio anterior.
export const authService = {
  register,
  verifyOtp: (input: { userId: string; code: string }) => verifyOtp(input.userId, input.code),
  resendOtp: (input: { userId: string }) => request<{ message: string }>('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => r.data),
};

/** POST /auth/crear-trabajador — solo Analista */
export function crearTrabajador(
  token: string,
  input: { name: string; email: string; password: string },
): Promise<{ trabajador: AuthUser & { passwordInicial: string } }> {
  return request<{ trabajador: AuthUser & { passwordInicial: string } }>('/auth/crear-trabajador', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  }).then((r) => r.data);
}