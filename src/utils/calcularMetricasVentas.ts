import type { CsvFile } from '../types/csv';
import type {
  MetricasVentas,
  PuntoParticipacion,
  PuntoTotal,
  VentasSelection,
} from '../types/ventas';

export interface ResultadoCalculoVentas {
  metricas: MetricasVentas;
  graficoPorCategoria: PuntoTotal[];
  graficoPorFecha: PuntoTotal[];
  participacionCategoria: PuntoParticipacion[];
}

function calcularMetricasVentas(
  file: CsvFile,
  mapeo: Required<Pick<VentasSelection, 'fecha' | 'categoria' | 'monto'>>
): ResultadoCalculoVentas {
  const idxFecha = file.headers.indexOf(mapeo.fecha);
  const idxCategoria = file.headers.indexOf(mapeo.categoria);
  const idxMonto = file.headers.indexOf(mapeo.monto);

  const totalesPorCategoria = new Map<string, number>();
  const totalesPorFecha = new Map<string, number>();

  let ingresoTotal = 0;
  let numeroTransacciones = 0;

  for (const row of file.rows) {
    const montoTexto = row[idxMonto];
    const monto = Number(montoTexto);

    if (montoTexto === undefined || Number.isNaN(monto)) {
      continue; // fila inválida para efectos numéricos, se ignora
    }

    const categoria = row[idxCategoria] ?? 'Sin categoría';
    const fecha = row[idxFecha] ?? 'Sin fecha';

    ingresoTotal += monto;
    numeroTransacciones += 1;

    totalesPorCategoria.set(categoria, (totalesPorCategoria.get(categoria) ?? 0) + monto);
    totalesPorFecha.set(fecha, (totalesPorFecha.get(fecha) ?? 0) + monto);
  }

  const graficoPorCategoria: PuntoTotal[] = Array.from(totalesPorCategoria, ([label, total]) => ({
    label,
    total,
  }));

  const graficoPorFecha: PuntoTotal[] = Array.from(totalesPorFecha, ([label, total]) => ({
    label,
    total,
  })).sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime());

  const categoriaTop = graficoPorCategoria.reduce(
    (mejor, actual) => (actual.total > mejor.total ? actual : mejor),
    { label: 'N/A', total: -Infinity }
  ).label;

  const participacionCategoria: PuntoParticipacion[] = graficoPorCategoria.map((punto) => ({
    categoria: punto.label,
    porcentaje: ingresoTotal > 0 ? (punto.total / ingresoTotal) * 100 : 0,
  }));

  const metricas: MetricasVentas = {
    ingresoTotal,
    ticketPromedio: numeroTransacciones > 0 ? ingresoTotal / numeroTransacciones : 0,
    categoriaTop,
    numeroTransacciones,
  };

  return { metricas, graficoPorCategoria, graficoPorFecha, participacionCategoria };
}

export { calcularMetricasVentas };