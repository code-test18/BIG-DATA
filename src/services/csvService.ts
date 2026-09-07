import Papa from 'papaparse';
import type { CsvFile as BackendCsvMeta } from '../types/csv';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-api-production-6a5a.up.railway.app';

// Forma exacta del objeto "csv" que devuelve el backend (distinta del CsvFile
// local, que además guarda headers/rows parseados en el navegador).
export interface BackendCsv {
  id: string;
  nombre: string;
  estado: 'PENDIENTE' | 'LIMPIO';
  tipo: 'PROPIO' | 'OTRO';
  urlArchivo: string;
  tamanioBytes: number;
  filasCount: number;
  columnCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListarCsvResponse {
  propios: BackendCsv[];
  otros: BackendCsv[];
}

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token ?? ''}`,
      // OJO: nunca setear Content-Type a mano cuando el body es FormData,
      // el navegador arma el boundary automáticamente.
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // sin body (algunos errores no devuelven JSON)
  }

  if (!res.ok) {
    const message = (data as { message?: string } | null)?.message || `Error ${res.status}`;
    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return data as T;
}

/** GET /csv — llamar UNA sola vez al entrar al dashboard */
export function listarCsvs(): Promise<ListarCsvResponse> {
  return authFetch<ListarCsvResponse>('/csv', { method: 'GET' });
}

/** POST /csv — subir un CSV nuevo */
export function subirCsv(
  file: File,
  opts: { filasCount?: number; columnCount?: number; tipo?: 'PROPIO' | 'OTRO' } = {},
): Promise<{ message: string; csv: BackendCsv }> {
  const formData = new FormData();
  formData.append('file', file);
  if (opts.filasCount !== undefined) formData.append('filasCount', String(opts.filasCount));
  if (opts.columnCount !== undefined) formData.append('columnCount', String(opts.columnCount));
  if (opts.tipo !== undefined) formData.append('tipo', opts.tipo);

  return authFetch('/csv', { method: 'POST', body: formData });
}

/** PUT /csv/:id/limpiar — reemplaza el archivo por su versión ya limpia */
export function marcarComoLimpio(
  id: string,
  file: File,
  opts: { filasCount?: number; columnCount?: number } = {},
): Promise<{ message: string; csv: BackendCsv }> {
  const formData = new FormData();
  formData.append('file', file);
  if (opts.filasCount !== undefined) formData.append('filasCount', String(opts.filasCount));
  if (opts.columnCount !== undefined) formData.append('columnCount', String(opts.columnCount));

  return authFetch(`/csv/${id}/limpiar`, { method: 'PUT', body: formData });
}

/** DELETE /csv/:id */
export function eliminarCsv(id: string): Promise<{ message: string }> {
  return authFetch(`/csv/${id}`, { method: 'DELETE' });
}

/**
 * Descarga y parsea el contenido real de un CSV ya guardado (a partir de su
 * urlArchivo en Cloudinary). Se usa al cargar el dashboard, ya que el backend
 * solo entrega metadata, no las filas.
 */
export function descargarYParsearCsv(url: string): Promise<{ headers: string[]; rows: string[][] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(url, {
      download: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = results.data;
        const headers = (rawData[0] ?? []).map((h) => h.trim()).filter(Boolean);
        if (headers.length === 0) {
          reject(new Error('El CSV descargado no contiene headers utilizables.'));
          return;
        }
        resolve({
          headers,
          rows: rawData.slice(1).map((row) => headers.map((_, index) => (row[index] ?? '').trim())),
        });
      },
      error: () => reject(new Error('No se pudo descargar/parsear el archivo desde Cloudinary.')),
    });
  });
}

export type { BackendCsvMeta };
