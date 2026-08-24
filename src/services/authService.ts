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
  password: string;
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

  // 3. Inicio de sesion
  login: async (data: LoginDTO) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Error en el login');
    return result;
  },

  // 4. Reenviar otp
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