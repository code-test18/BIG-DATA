import type { CrearTareaInput, Tarea } from '../types/tarea';

/**
 * MOCK de /tareas mientras se conecta el backend real. Las firmas ya
 * calzan con el contrato acordado (GET /tareas, POST /tareas,
 * PUT /tareas/:id/tomar, PUT /tareas/:id/completar, DELETE /tareas/:id),
 * así que cuando el backend esté listo solo se reemplaza el cuerpo de cada
 * función por un fetch real — InsightsView.tsx e Inteligencia.tsx no
 * necesitan cambiar.
 */

const STORAGE_KEY = 'mock_tareas';

function leerTareas(): Tarea[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Tarea[];
  } catch {
    return [];
  }
}

function guardarTareas(tareas: Tarea[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tareas));
}

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** GET /tareas */
export function listarTareas(): Promise<Tarea[]> {
  return delay(leerTareas());
}

/** POST /tareas */
export function crearTarea(input: CrearTareaInput): Promise<Tarea> {
  const nueva: Tarea = {
    id: crypto.randomUUID(),
    titulo: input.titulo,
    descripcion: input.descripcion,
    estado: 'PENDIENTE',
    columnaRelacionada: input.columnaRelacionada,
    datasetPropioId: input.datasetPropioId,
    datasetOtroId: input.datasetOtroId,
    creadaPor: input.creadaPor,
    asignadaA: input.asignadaA,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  guardarTareas([...leerTareas(), nueva]);
  return delay(nueva);
}

/** PUT /tareas/:id/tomar */
export function tomarTarea(id: string, userId: string): Promise<Tarea> {
  const tareas = leerTareas();
  const index = tareas.findIndex((t) => t.id === id);
  if (index === -1) return Promise.reject(new Error('Tarea no encontrada.'));
  if (tareas[index].estado !== 'PENDIENTE') return Promise.reject(new Error('Esta tarea ya fue tomada.'));

  tareas[index] = { ...tareas[index], estado: 'EN_PROGRESO', tomadaPor: userId, updatedAt: new Date().toISOString() };
  guardarTareas(tareas);
  return delay(tareas[index]);
}

/** PUT /tareas/:id/completar */
export function completarTarea(id: string): Promise<Tarea> {
  const tareas = leerTareas();
  const index = tareas.findIndex((t) => t.id === id);
  if (index === -1) return Promise.reject(new Error('Tarea no encontrada.'));

  tareas[index] = { ...tareas[index], estado: 'COMPLETADA', updatedAt: new Date().toISOString() };
  guardarTareas(tareas);
  return delay(tareas[index]);
}

/** DELETE /tareas/:id */
export function eliminarTarea(id: string): Promise<void> {
  guardarTareas(leerTareas().filter((t) => t.id !== id));
  return delay(undefined);
}