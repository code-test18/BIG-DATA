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
  graficoUnidadesPorCategoria?: PuntoTotal[];
}

function calcularMetricasVentas(
  file: CsvFile,
  mapeo: Required<Pick<VentasSelection, 'fecha' | 'categoria' | 'monto'>> &
    Pick<VentasSelection, 'cantidad'>
): ResultadoCalculoVentas {
  const idxFecha = file.headers.indexOf(mapeo.fecha);
  const idxCategoria = file.headers.indexOf(mapeo.categoria);
  const idxMonto = file.headers.indexOf(mapeo.monto);
  const idxCantidad = mapeo.cantidad ? file.headers.indexOf(mapeo.cantidad) : -1;

  const totalesPorCategoria = new Map<string, number>();
  const totalesPorFecha = new Map<string, number>();
  const unidadesPorCategoria = new Map<string, number>();

  let ingresoTotal = 0;
  let numeroTransacciones = 0;
  let unidadesTotales = 0;

  for (const row of file.rows) {
    const montoTexto = row[idxMonto];
    const monto = Number(montoTexto);

    if (montoTexto === undefined || Number.isNaN(monto)) {
      continue;
    }

    const categoria = row[idxCategoria] ?? 'Sin categoría';
    const fecha = row[idxFecha] ?? 'Sin fecha';

    ingresoTotal += monto;
    numeroTransacciones += 1;

    totalesPorCategoria.set(categoria, (totalesPorCategoria.get(categoria) ?? 0) + monto);
    totalesPorFecha.set(fecha, (totalesPorFecha.get(fecha) ?? 0) + monto);

    if (idxCantidad !== -1) {
      const cantidad = Number(row[idxCantidad]);
      if (!Number.isNaN(cantidad)) {
        unidadesTotales += cantidad;
        unidadesPorCategoria.set(categoria, (unidadesPorCategoria.get(categoria) ?? 0) + cantidad);
      }
    }
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
    ...(idxCantidad !== -1 ? { unidadesTotales } : {}),
  };

  const graficoUnidadesPorCategoria: PuntoTotal[] | undefined =
    idxCantidad !== -1
      ? Array.from(unidadesPorCategoria, ([label, total]) => ({ label, total }))
      : undefined;

  return {
    metricas,
    graficoPorCategoria,
    graficoPorFecha,
    participacionCategoria,
    graficoUnidadesPorCategoria,
  };
}

export { calcularMetricasVentas };