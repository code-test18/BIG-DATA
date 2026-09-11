export type SolicitudFuente = 'LANDING' | 'CONTACTO';
export type SolicitudEstado = 'NUEVA' | 'PENDIENTE' | 'ATENDIDA';

export interface Solicitud {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  asunto: string;
  mensaje: string;
  fuente: SolicitudFuente;
  estado: SolicitudEstado;
  createdAt: string;
}

export interface CrearSolicitudInput {
  nombre: string;
  email: string;
  telefono?: string;
  asunto?: string;
  mensaje: string;
  fuente: SolicitudFuente;
}

const STORAGE_KEY = 'bigdata_solicitudes';

function leerSolicitudes(): Solicitud[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function guardarSolicitudes(solicitudes: Solicitud[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(solicitudes));
}

export function listarSolicitudes(): Solicitud[] {
  return [...leerSolicitudes()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function crearSolicitud(input: CrearSolicitudInput): Solicitud {
  const solicitud: Solicitud = {
    id: crypto.randomUUID(),
    nombre: input.nombre.trim(),
    email: input.email.trim(),
    telefono: (input.telefono ?? '').trim(),
    asunto: (input.asunto ?? '').trim() || 'Consulta general',
    mensaje: input.mensaje.trim(),
    fuente: input.fuente,
    estado: 'NUEVA',
    createdAt: new Date().toISOString(),
  };

  const solicitudes = leerSolicitudes();
  solicitudes.unshift(solicitud);
  guardarSolicitudes(solicitudes);
  return solicitud;
}

export function actualizarEstadoSolicitud(id: string, estado: SolicitudEstado): Solicitud | null {
  const solicitudes = leerSolicitudes();
  const index = solicitudes.findIndex((solicitud) => solicitud.id === id);
  if (index === -1) return null;

  solicitudes[index] = { ...solicitudes[index], estado };
  guardarSolicitudes(solicitudes);
  return solicitudes[index];
}

export function obtenerResumenSolicitudes() {
  const solicitudes = listarSolicitudes();
  return {
    total: solicitudes.length,
    nuevas: solicitudes.filter((s) => s.estado === 'NUEVA').length,
    pendientes: solicitudes.filter((s) => s.estado === 'PENDIENTE').length,
    atendidas: solicitudes.filter((s) => s.estado === 'ATENDIDA').length,
    landing: solicitudes.filter((s) => s.fuente === 'LANDING').length,
    contacto: solicitudes.filter((s) => s.fuente === 'CONTACTO').length,
  };
}
