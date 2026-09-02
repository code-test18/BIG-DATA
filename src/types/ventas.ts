// Roles de columna que el usuario debe mapear para el análisis de ventas.
// 'cantidad' es opcional porque no todos los CSV traen una columna de unidades.
export interface VentasSelection {
  fecha?: string;
  categoria?: string;
  monto?: string;
  cantidad?: string;
}

// Un punto de dato para gráficos de barras/línea: una categoría o fecha, con su total.
export interface PuntoTotal {
  label: string;
  total: number;
}

// Un punto de dato para el gráfico de torta: categoría con su % de participación.
export interface PuntoParticipacion {
  categoria: string;
  porcentaje: number;
}

// Métricas comerciales fijas que se muestran en las tarjetas.
export interface MetricasVentas {
  ingresoTotal: number;
  ticketPromedio: number;
  categoriaTop: string;
  numeroTransacciones: number;
  unidadesTotales?: number;
}

// Un reporte de Ventas completo y ya calculado, listo para guardar y volver a mostrar
// sin necesidad de recalcular ni de tener el CSV original disponible.
export interface VentaReporte {
  id: string;
  tipo: 'ventas';
  nombreArchivo: string;
  nombre: string;
  fecha: string;
  createdAt: string;
  resumen: string;
  mapeo?: Required<Pick<VentasSelection, 'fecha' | 'categoria' | 'monto'>> &
    Pick<VentasSelection, 'cantidad'>;
  metricas: Array<{ label: string; value: string | number }> | MetricasVentas;
  graficoPorCategoria?: PuntoTotal[];
  graficoPorFecha?: PuntoTotal[];
  graficoUnidadesPorCategoria?: PuntoTotal[];
  participacionCategoria?: PuntoParticipacion[];
}