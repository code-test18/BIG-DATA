export type EstadoTarea = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA';

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  estado: EstadoTarea;
  columnaRelacionada?: string;
  datasetPropioId?: string;
  datasetOtroId?: string;
  creadaPor: string;
  asignadaA?: string;
  tomadaPor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrearTareaInput {
  titulo: string;
  descripcion: string;
  columnaRelacionada?: string;
  datasetPropioId?: string;
  datasetOtroId?: string;
  creadaPor: string;
  asignadaA?: string;
}