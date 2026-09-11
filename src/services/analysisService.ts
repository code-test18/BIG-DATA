import type { AnalysisRequest, AnalysisResult, AnalysisSelection, AnalysisTarget, AnalysisValidation } from '../types/analysis';
import type { CsvFile } from '../types/csv';

const numberPattern = /^[-+]?\d[\d.,\s]*$/;

function parseNumber(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, '');
  if (!normalized || !numberPattern.test(normalized)) return null;
  const decimalSeparator = normalized.lastIndexOf(',') > normalized.lastIndexOf('.') ? ',' : '.';
  const parsed = decimalSeparator === ','
    ? Number(normalized.replace(/\./g, '').replace(',', '.'))
    : Number(normalized.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function getCell(file: CsvFile, row: string[], header?: string): string {
  const index = header ? file.headers.indexOf(header) : -1;
  return index >= 0 ? (row[index] ?? '').trim() : '';
}

function formatMetricValue(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return value % 1 === 0 ? String(value) : value.toFixed(2);
}

export function validateAnalysis(file: CsvFile | undefined, target: AnalysisTarget | undefined, selection: AnalysisSelection): AnalysisValidation {
  if (!file) return { valid: false, message: 'No hay un CSV disponible para analizar.' };
  if (!file.headers.length) return { valid: false, message: 'El CSV no contiene headers utilizables.' };
  if (target !== 'dynamic_mapping') return { valid: false, message: 'Selecciona un análisis dinámico.' };
  const category = selection.category;
  const metric = selection.metric;
  if (!category || !metric) return { valid: false, message: 'Selecciona una categoría y una métrica.' };
  if (category === metric) return { valid: false, message: 'La categoría y la métrica deben ser columnas diferentes.' };
  if (!file.headers.includes(category) || !file.headers.includes(metric)) return { valid: false, message: 'Las columnas seleccionadas no existen en el CSV.' };
  if (!file.rows.some((row) => parseNumber(getCell(file, row, metric)) !== null)) return { valid: false, message: `La columna "${metric}" no contiene valores numéricos válidos.` };
  return { valid: true };
}

export function processAnalysis(file: CsvFile, request: AnalysisRequest): AnalysisResult {
  const category = request.columns.category;
  const metric = request.columns.metric;
  const operation = request.operation ?? 'SUM';
  if (!category || !metric) throw new Error('La configuración del análisis está incompleta.');

  const grouped = new Map<string, number[]>();
  let processedRows = 0;

  file.rows.forEach((row) => {
    const categoryValue = getCell(file, row, category);
    const metricValue = parseNumber(getCell(file, row, metric));
    if (!categoryValue || metricValue === null) return;

    const values = grouped.get(categoryValue) ?? [];
    values.push(metricValue);
    grouped.set(categoryValue, values);
    processedRows += 1;
  });

  const series = [...grouped.entries()]
    .map(([label, values]) => {
      const rawValue = operation === 'COUNT'
        ? values.length
        : operation === 'AVG'
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : values.reduce((sum, value) => sum + value, 0);

      return { label, value: rawValue };
    })
    .sort((left, right) => right.value - left.value)
    .slice(0, 10);

  const total = series.reduce((sum, item) => sum + item.value, 0);
  const top = series[0];

  const metricLabel = operation === 'SUM' ? `Total de ${metric}` : operation === 'AVG' ? `Promedio de ${metric}` : `Conteo de ${metric}`;

  return {
    target: 'dynamic_mapping',
    title: `${metric} agrupado por ${category}`,
    sourceFileName: file.name,
    configuration: request,
    metrics: [
      { label: 'Registros procesados', value: processedRows },
      { label: 'Categorías únicas', value: grouped.size },
      { label: metricLabel, value: formatMetricValue(total) },
      { label: 'Top categoría', value: top ? top.label : 'N/A' },
    ],
    series,
    processedRows,
    generatedAt: new Date().toLocaleString(),
  };
}
