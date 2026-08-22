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
  if (!category || !metric) throw new Error('La configuración del análisis está incompleta.');

  const totals = new Map<string, number>();
  let processedRows = 0;
  file.rows.forEach((row) => {
    const categoryValue = getCell(file, row, category);
    const metricValue = parseNumber(getCell(file, row, metric));
    if (!categoryValue || metricValue === null) return;
    totals.set(categoryValue, (totals.get(categoryValue) ?? 0) + metricValue);
    processedRows += 1;
  });

  const series = [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 20);
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);

  return {
    target: 'dynamic_mapping',
    title: `${metric} agrupado por ${category}`,
    sourceFileName: file.name,
    configuration: request,
    metrics: [
      { label: 'Registros procesados', value: processedRows },
      { label: 'Categorías encontradas', value: totals.size },
      { label: `Total de ${metric}`, value: total.toLocaleString(undefined, { maximumFractionDigits: 2 }) },
    ],
    series,
    processedRows,
    generatedAt: new Date().toLocaleString(),
  };
}
