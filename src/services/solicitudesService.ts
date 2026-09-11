const API_URL = import.meta.env.VITE_API_URL || 'https://backend-api-production-6a5a.up.railway.app';

export type SolicitudEstado = 'PENDIENTE' | 'RESPONDIDA';

export interface Solicitud {
  id: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  mensaje: string;
  estado: SolicitudEstado;
  respuesta: string | null;
  respondidaAt: string | null;
  createdAt: string;
}

export interface CrearSolicitudInput {
  nombreCompleto: string;
  correo: string;
  telefono?: string;
  mensaje: string;
}

export interface CrearSolicitudResponse {
  message: string;
  solicitud: Solicitud;
}

export interface SolicitudRespuestaResponse {
  message: string;
  solicitud: Solicitud;
}

function getToken(): string | null {
  return sessionStorage.getItem('auth_token');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // la API puede devolver respuesta vacía
  }

  if (!res.ok) {
    const message = (data as { message?: string } | null)?.message || `Error ${res.status}`;
    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return data as T;
}

export async function crearSolicitud(input: CrearSolicitudInput): Promise<Solicitud> {
  const { solicitud } = await apiFetch<CrearSolicitudResponse>('/solicitudes', {
    method: 'POST',
    body: JSON.stringify({
      nombreCompleto: input.nombreCompleto,
      correo: input.correo,
      telefono: input.telefono ?? '',
      mensaje: input.mensaje,
    }),
  });

  return solicitud;
}

export async function listarSolicitudes(): Promise<Solicitud[]> {
  const token = getToken();
  if (!token) {
    throw new Error('Debes iniciar sesión como analista para ver las solicitudes.');
  }

  return apiFetch<Solicitud[]>('/solicitudes', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function responderSolicitud(id: string, respuesta: string): Promise<Solicitud> {
  const token = getToken();
  if (!token) {
    throw new Error('Debes iniciar sesión como analista para responder solicitudes.');
  }

  const { solicitud } = await apiFetch<SolicitudRespuestaResponse>(`/solicitudes/${id}/responder`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ respuesta }),
  });

  return solicitud;
}

export async function editarRespuestaSolicitud(id: string, respuesta: string): Promise<Solicitud> {
  const token = getToken();
  if (!token) {
    throw new Error('Debes iniciar sesión como analista para editar la respuesta.');
  }

  const { solicitud } = await apiFetch<SolicitudRespuestaResponse>(`/solicitudes/${id}/editar-respuesta`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ respuesta }),
  });

  return solicitud;
}

export function obtenerResumenSolicitudes(solicitudes: Solicitud[]) {
  return {
    total: solicitudes.length,
    pendientes: solicitudes.filter((s) => s.estado === 'PENDIENTE').length,
    respondidas: solicitudes.filter((s) => s.estado === 'RESPONDIDA').length,
  };
}
