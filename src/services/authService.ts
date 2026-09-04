const API_URL = import.meta.env.VITE_API_URL || 'https://backend-api-production-6a5a.up.railway.app';

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface VerifyOtpDTO {
  userId: string;
  code: string;
}

export interface LoginDTO {
  email: string;
  password?: string;
}

export interface RequestOtpDTO {
  email: string;
}

export interface ResendOtpDTO {
  userId: string;
}

export const authService = {
  // 1. Registro de usuario
  register: async (data: RegisterDTO) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Error en el registro');
    return result;
  },

  // 2. Verificación de OTP
  verifyOtp: async (data: VerifyOtpDTO) => {
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Error al verificar OTP');
    return result;
  },

  // 3. Solicitar código OTP por correo
  requestOtp: async (data: RequestOtpDTO) => {
    const candidates = [
      { path: '/auth/request-otp', payload: { email: data.email } },
      { path: '/auth/send-otp', payload: { email: data.email } },
      { path: '/auth/login', payload: { email: data.email } },
    ];

    let lastError: Error | null = null;

    for (const candidate of candidates) {
      try {
        const response = await fetch(`${API_URL}${candidate.path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(candidate.payload),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          lastError = new Error(result.message || `Error en ${candidate.path}`);
          continue;
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Error al solicitar OTP');
      }
    }

    throw lastError ?? new Error('Error al solicitar OTP');
  },

  // 4. Inicio de sesion (compatibilidad con backend que aún use login tradicional)
  login: async (data: LoginDTO) => {
    const payload = {
      email: data.email,
      ...(data.password !== undefined ? { password: data.password } : {}),
    };

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Error en el login');
    return result;
  },

  // 5. Reenviar otp
  resendOtp: async (data: ResendOtpDTO) => {
    const response = await fetch(`${API_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Error al reenviar OTP');
    return result;
  },
};