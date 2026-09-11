import type { VentaReporte } from '../types/ventas';

const STORAGE_KEY = 'reportes_ventas';

function obtenerReportes(): VentaReporte[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function guardarReporte(reporte: VentaReporte): void {
  const reportesActuales = obtenerReportes();
  const nuevaLista = [...reportesActuales, reporte];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevaLista));
}

function eliminarReporte(id: string): void {
  const reportesActuales = obtenerReportes();
  const nuevaLista = reportesActuales.filter((reporte) => reporte.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevaLista));
}

export { obtenerReportes, guardarReporte, eliminarReporte };