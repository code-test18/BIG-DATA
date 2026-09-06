import type { DatasetMetrics, Insight, InsightLevel } from '../pages/dashboard/proceso/ProcesarTypes';
import { money, pct } from './format';

function topEntry(record: Record<string, number>): [string, number] | null {
  const entries = Object.entries(record);
  if (!entries.length) return null;
  return entries.reduce((max, entry) => (entry[1] > max[1] ? entry : max));
}

export function buildLocalInsights(
  metricsA: DatasetMetrics,
  metricsB: DatasetMetrics,
  nameA: string,
  nameB: string
): Insight[] {
  const insights: Insight[] = [];
  let counter = 0;
  const push = (nivel: InsightLevel, titulo: string, mensaje: string) =>
    insights.push({ id: `local-${counter++}`, nivel, titulo, mensaje, origen: 'motor' });

  if (metricsB.hasDescuentos && !metricsA.hasDescuentos) {
    push(
      'correcto',
      `Promociones y descuentos: lo tiene ${nameB}, nosotros no`,
      `${nameB} registra descuentos aplicados por un volumen total de ${money(metricsB.totalDescuentos)}.`
    );
  }

  if (metricsB.hasCanalVenta && !metricsA.hasCanalVenta) {
    push(
      'advertencia',
      'Diversificación de canales de venta',
      `${nameB} mide sus ingresos por canal de venta; ${nameA} no cuenta con esta variable.`
    );
  }

  const leaderA = topEntry(metricsA.categories);
  const leaderB = topEntry(metricsB.categories);
  if (leaderA && leaderB && leaderA[0] !== leaderB[0]) {
    push(
      'advertencia',
      'Categorías líder distintas',
      `En ${nameA} la categoría con más ingresos es "${leaderA[0]}" (${money(leaderA[1])}); en ${nameB} es "${leaderB[0]}" (${money(leaderB[1])}).`
    );
  }

  if (metricsA.ticketPromedio > 0 && metricsB.ticketPromedio > 0) {
    const diff = ((metricsA.ticketPromedio - metricsB.ticketPromedio) / metricsB.ticketPromedio) * 100;
    if (Math.abs(diff) >= 3) {
      const quien = diff > 0 ? nameA : nameB;
      const nivel: InsightLevel = diff > 0 ? 'correcto' : Math.abs(diff) >= 20 ? 'critico' : 'advertencia';
      push(
        nivel,
        `${quien} tiene el ticket promedio más alto`,
        `El ticket promedio de ${nameA} (${money(metricsA.ticketPromedio)}) es ${pct(diff)} respecto al de ${nameB} (${money(metricsB.ticketPromedio)}).`
      );
    }
  }

  const monthsA = Object.entries(metricsA.monthly).sort(([m1], [m2]) => m1.localeCompare(m2));
  const monthsB = Object.entries(metricsB.monthly).sort(([m1], [m2]) => m1.localeCompare(m2));
  if (monthsA.length >= 2 && monthsB.length >= 2) {
    const growth = (months: [string, number][]) => {
      const first = months[0][1];
      const last = months[months.length - 1][1];
      return first > 0 ? ((last - first) / first) * 100 : 0;
    };
    const growthA = growth(monthsA);
    const growthB = growth(monthsB);
    const nivel: InsightLevel = growthA <= -15 ? 'critico' : growthA < 0 ? 'advertencia' : 'correcto';
    push(
      nivel,
      `Tendencia del período — ${nameA}`,
      `${nameA} ${growthA >= 0 ? 'creció' : 'cayó'} ${pct(growthA)} en el período; ${nameB} ${growthB >= 0 ? 'creció' : 'cayó'} ${pct(growthB)} en el mismo lapso.`
    );
  }

  if (metricsA.productosDistintos !== metricsB.productosDistintos) {
    const masVariedad = metricsA.productosDistintos > metricsB.productosDistintos ? nameA : nameB;
    const diffProductos = Math.abs(metricsA.productosDistintos - metricsB.productosDistintos);
    push(
      'correcto',
      `${masVariedad} tiene más variedad de catálogo`,
      `${masVariedad} vende ${diffProductos} producto${diffProductos === 1 ? '' : 's'} distinto${diffProductos === 1 ? '' : 's'} más que su comparado.`
    );
  }

  return insights;
}

export function buildStructuralInsights(qualityA: number, qualityB: number, rowDifferencePct: number): Insight[] {
  const insights: Insight[] = [];
  let counter = 0;
  const push = (nivel: InsightLevel, titulo: string, mensaje: string) =>
    insights.push({ id: `struct-${counter++}`, nivel, titulo, mensaje, origen: 'motor' });

  const qualityDelta = qualityB - qualityA;
  if (Math.abs(qualityDelta) >= 1) {
    const nivel: InsightLevel = qualityDelta < -10 ? 'critico' : qualityDelta < 0 ? 'advertencia' : 'correcto';
    push(
      nivel,
      'Score de calidad de datos',
      `La calidad general del dataset ${qualityDelta > 0 ? 'mejoró' : 'empeoró'} en ${Math.abs(qualityDelta).toFixed(1)} puntos (A: ${qualityA}% → B: ${qualityB}%).`
    );
  }

  if (Math.abs(rowDifferencePct) >= 30) {
    push(
      'critico',
      'Variación fuerte en volumen de registros',
      `El número de filas cambió ${pct(rowDifferencePct)} entre ambos datasets — revisa si hay pérdida o duplicación de datos en la fuente.`
    );
  }

  return insights;
}