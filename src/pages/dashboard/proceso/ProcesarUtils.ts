import Papa from 'papaparse';
import type { DatasetMetrics, ParsedDataset, DatasetComparison, ComparisonRow, ColumnMapping } from './ProcesarTypes';

const EMPTY_METRICS: DatasetMetrics = {
  totalIngresos: 0,
  totalUnidades: 0,
  ticketPromedio: 0,
  productosDistintos: 0,
  categories: {},
  monthly: {},
  topProducts: [],
  hasDescuentos: false,
  totalDescuentos: 0,
  hasCanalVenta: false,
  canalVentaStats: {},
};

const getMonthKey = (value: unknown): string => {
  const rawDate = String(value ?? '').trim();
  if (!rawDate) return '';

  const isoMatch = rawDate.match(/^(\d{4})[-/](\d{1,2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}`;

  const dayFirstMatch = rawDate.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  return dayFirstMatch ? `${dayFirstMatch[3]}-${dayFirstMatch[2].padStart(2, '0')}` : rawDate.slice(0, 7);
};

export const normalizeNumber = (value: string): number | null => {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, '').replace(/[^0-9,.-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === ',') return null;

  const normalized = cleaned.includes(',') && cleaned.includes('.')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(',', '.');

  const numericValue = Number(normalized);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const normalizeHeader = (header: string): string =>
  header.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

export const inferColumnMapping = (headers: string[]): ColumnMapping => {
  const normalizedHeaders = headers.map((header) => ({ original: header, normalized: normalizeHeader(header) }));
  const findHeader = (aliases: string[]): string | null => {
    const match = normalizedHeaders.find(({ normalized }) => aliases.includes(normalized));
    return match?.original ?? null;
  };

  return {
    ingreso: findHeader(['ingresototal', 'ingreso', 'ventas', 'venta', 'monto', 'importe']),
    unidades: findHeader(['unidadesvendidas', 'unidades', 'cantidad']),
    producto: findHeader(['producto', 'nombreproducto']),
    categoria: findHeader(['categoria', 'tipoproducto']),
    fecha: findHeader(['fecha', 'date']),
    descuento: findHeader(['descuento', 'descuentoaplicado']),
    canal: findHeader(['canal', 'canalventa']),
  };
};

/**
 * Calcula métricas de negocio a partir de un ColumnMapping confirmado por el usuario
 * (ya no adivina nombres de columna en español fijo).
 */
export const processDataset = (rows: string[][], headers: string[], mapping: ColumnMapping): DatasetMetrics => {
  if (!rows.length) return { ...EMPTY_METRICS };

  const columnIndex = new Map(headers.map((header, index) => [header, index]));
  const idx = (col: string | null) => (col ? columnIndex.get(col) : undefined);
  const read = (row: string[], i: number | undefined): string => (i !== undefined ? row[i] ?? '' : '');

  const ingresoIdx = idx(mapping.ingreso);
  const unidadesIdx = idx(mapping.unidades);
  const productoIdx = idx(mapping.producto);
  const categoriaIdx = idx(mapping.categoria);
  const fechaIdx = idx(mapping.fecha);
  const descuentoIdx = idx(mapping.descuento);
  const canalIdx = idx(mapping.canal);

  const hasDescuentos = descuentoIdx !== undefined;
  const hasCanalVenta = canalIdx !== undefined;

  const productMap: Record<string, { unidades: number; ingresos: number }> = {};
  const categories: Record<string, number> = {};
  const monthly: Record<string, number> = {};
  const canalVentaStats: Record<string, number> = {};
  let totalIngresos = 0;
  let totalUnidades = 0;
  let totalDescuentos = 0;

  rows.forEach((row) => {
    const ingreso = normalizeNumber(read(row, ingresoIdx)) ?? 0;
    const unidades = normalizeNumber(read(row, unidadesIdx)) ?? 1;
    const producto = read(row, productoIdx).trim();
    const categoria = read(row, categoriaIdx).trim();
    const month = getMonthKey(read(row, fechaIdx));

    totalIngresos += ingreso;
    totalUnidades += unidades;
    if (hasDescuentos) totalDescuentos += normalizeNumber(read(row, descuentoIdx)) ?? 0;

    if (producto) {
      productMap[producto] ??= { unidades: 0, ingresos: 0 };
      productMap[producto].unidades += unidades;
      productMap[producto].ingresos += ingreso;
    }
    if (categoria) categories[categoria] = (categories[categoria] ?? 0) + ingreso;
    if (month) monthly[month] = (monthly[month] ?? 0) + ingreso;

    const canal = read(row, canalIdx).trim();
    if (hasCanalVenta && canal) canalVentaStats[canal] = (canalVentaStats[canal] ?? 0) + ingreso;
  });

  return {
    totalIngresos,
    totalUnidades,
    ticketPromedio: totalIngresos / rows.length,
    productosDistintos: Object.keys(productMap).length,
    categories,
    monthly,
    topProducts: Object.entries(productMap)
      .map(([producto, data]) => ({ producto, ...data }))
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5),
    hasDescuentos,
    totalDescuentos,
    hasCanalVenta,
    canalVentaStats,
  };
};

export const isNullValue = (value: string | number, isNumericColumn: boolean = false): boolean => {
  if (value === null || value === undefined) return true;
  const strVal = String(value).trim().toLowerCase();
  if (['', 'null', 'nil', 'none', 'n/a', 'na', 'nan', 'undefined', '-'].includes(strVal)) return true;
  if (isNumericColumn && strVal === '0') return true;
  return false;
};

export const parseCsvDataset = (file: File): Promise<ParsedDataset> =>
  new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = results.data.filter((row) => row && row.some((cell) => String(cell).trim() !== ''));
        if (rawData.length === 0) {
          reject(new Error('El CSV está vacío.'));
          return;
        }
        const headers = rawData[0].map((header) => String(header).trim()).filter(Boolean);
        if (headers.length === 0) {
          reject(new Error('El CSV no tiene columnas válidas.'));
          return;
        }
        const rows = rawData.slice(1).map((row) => headers.map((_, index) => String(row[index] ?? '').trim()));
        resolve({ name: file.name, headers, rows });
      },
      error: () => reject(new Error('No se pudo leer el CSV.')),
    });
  });

export const inferTypeFromValues = (values: string[]): string => {
  const usableValues = values.filter((value) => !isNullValue(value));
  if (usableValues.length === 0) return 'desconocido';

  const numericValues = usableValues.map((value) => normalizeNumber(value)).filter((value) => value !== null);
  if (numericValues.length === usableValues.length) return 'numérico';

  const booleanValues = usableValues
    .map((value) => value.trim().toLowerCase())
    .filter((value) => ['true', 'false', 'yes', 'no', 'si'].includes(value));
  if (booleanValues.length === usableValues.length) return 'boolean';

  const dateValues = usableValues.filter((value) => !Number.isNaN(Date.parse(value)));
  if (dateValues.length === usableValues.length) return 'fecha';

  return 'texto';
};

export const mean = (values: number[]): number =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

export const formatMetric = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  return value % 1 === 0 ? String(value) : value.toFixed(2);
};

/**
 * Comparación ESTRUCTURAL entre datasets (columnas, calidad, duplicados, volumen de filas).
 * Ya NO intenta adivinar columnas de negocio por regex (ventas/género/categoría); el usuario
 * confirma el ColumnMapping manualmente antes de calcular las métricas.
 */
export const buildComparison = async (datasetA: ParsedDataset, datasetB: ParsedDataset): Promise<DatasetComparison> => {
  const sharedColumns = datasetA.headers.filter((header) => datasetB.headers.includes(header));
  const newColumnsInB = datasetB.headers.filter((header) => !datasetA.headers.includes(header));
  const missingInB = datasetA.headers.filter((header) => !datasetB.headers.includes(header));

  const rowsA = datasetA.rows.length;
  const rowsB = datasetB.rows.length;
  const rowDifference = rowsB - rowsA;
  const rowDifferencePct = rowsA === 0 ? (rowsB === 0 ? 0 : 100) : (rowDifference / rowsA) * 100;

  const allColumns = Array.from(new Set([...datasetA.headers, ...datasetB.headers]));

  const getDatasetMetrics = (dataset: ParsedDataset) => {
    if (dataset.rows.length === 0) return { quality: 0, duplicates: 0, nullRate: 0 };

    let nullishCells = 0;
    dataset.headers.forEach((_, colIndex) => {
      const sampleValues = dataset.rows.map((r) => r[colIndex] ?? '');
      const isNumeric = inferTypeFromValues(sampleValues) === 'numérico';
      sampleValues.forEach((val) => {
        if (isNullValue(val, isNumeric)) nullishCells++;
      });
    });

    const seenRows = new Set<string>();
    let duplicateRows = 0;
    dataset.rows.forEach((row) => {
      const rowKey = row.join('|');
      if (seenRows.has(rowKey)) duplicateRows += 1;
      else seenRows.add(rowKey);
    });

    const totalCells = (dataset.rows.length * dataset.headers.length) || 1;
    const nullRate = (nullishCells / totalCells) * 100;
    const duplicatePenalty = (duplicateRows / dataset.rows.length) * 10;
    const quality = Math.max(0, parseFloat((100 - nullRate - duplicatePenalty).toFixed(1)));

    return { quality, duplicates: duplicateRows, nullRate };
  };

  const metricsA = getDatasetMetrics(datasetA);
  const metricsB = getDatasetMetrics(datasetB);
  const qualityDelta = metricsB.quality - metricsA.quality;

  const tableRows: ComparisonRow[] = [];
  const chunkSize = 10;

  for (let index = 0; index < allColumns.length; index += chunkSize) {
    const chunk = allColumns.slice(index, index + chunkSize);

    chunk.forEach((column) => {
      const inA = datasetA.headers.includes(column);
      const inB = datasetB.headers.includes(column);
      const state: ComparisonRow['state'] = inA && inB ? 'Compartida' : inB ? 'Nueva en B' : 'Eliminada en B';

      const aColumnValues = inA ? datasetA.rows.map((row) => row[datasetA.headers.indexOf(column)] ?? '') : [];
      const bColumnValues = inB ? datasetB.rows.map((row) => row[datasetB.headers.indexOf(column)] ?? '') : [];

      const isIgnoredForMedia = /id|identifier|code|codigo|date|fecha|time|hora/i.test(column);
      const typeA = inA ? (isIgnoredForMedia ? 'texto/fecha' : inferTypeFromValues(aColumnValues)) : '-';
      const typeB = inB ? (isIgnoredForMedia ? 'texto/fecha' : inferTypeFromValues(bColumnValues)) : '-';

      const isNumericA = typeA === 'numérico';
      const isNumericB = typeB === 'numérico';

      const numericA = aColumnValues
        .map((value) => normalizeNumber(value))
        .filter((value): value is number => value !== null && value !== 0);
      const numericB = bColumnValues
        .map((value) => normalizeNumber(value))
        .filter((value): value is number => value !== null && value !== 0);

      const canComputeMean = !isIgnoredForMedia && typeA !== 'fecha' && typeB !== 'fecha';
      const mediaA = numericA.length && canComputeMean ? mean(numericA) : 0;
      const mediaB = numericB.length && canComputeMean ? mean(numericB) : 0;

      const countNullsA = inA ? aColumnValues.filter((value) => isNullValue(value, isNumericA)).length : 0;
      const countNullsB = inB ? bColumnValues.filter((value) => isNullValue(value, isNumericB)).length : 0;

      tableRows.push({
        column,
        state,
        typeA,
        typeB,
        mediaA: inA && numericA.length && canComputeMean ? formatMetric(mediaA) : '—',
        mediaB: inB && numericB.length && canComputeMean ? formatMetric(mediaB) : '—',
        nulosA: countNullsA,
        nulosB: countNullsB,
      });
    });

    if (index + chunkSize < allColumns.length) {
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(null)));
    }
  }

  // Insights puramente estructurales; los de negocio se calculan sobre el mapping confirmado.
  const insights: string[] = [];

  if (rowDifference !== 0) {
    const direction = rowDifference > 0 ? 'incrementó' : 'redujo';
    insights.push(
      `**Volumen de datos:** El Dataset B ${direction} en **${Math.abs(rowDifference)} registros** (${Math.abs(rowDifferencePct).toFixed(1)}% respecto a A).`
    );
  } else {
    insights.push(`**Volumen de datos:** Ambos datasets mantienen exactamente la misma cantidad de registros (${rowsA}).`);
  }

  if (newColumnsInB.length > 0) {
    insights.push(`**Nuevas columnas en B:** Se añadieron ${newColumnsInB.length} columna(s): \`${newColumnsInB.join(', ')}\`.`);
  }
  if (missingInB.length > 0) {
    insights.push(`**Columnas eliminadas en B:** Desaparecieron ${missingInB.length} columna(s) presentes en A: \`${missingInB.join(', ')}\`.`);
  }

  if (metricsB.duplicates > metricsA.duplicates) {
    insights.push(
      `**Alerta de duplicados:** Se registraron **${metricsB.duplicates - metricsA.duplicates} filas duplicadas adicionales** en el Dataset B.`
    );
  }

  if (qualityDelta !== 0) {
    const qualDirection = qualityDelta > 0 ? 'mejoró' : 'empeoró';
    insights.push(
      `**Score de Calidad:** La calidad general del dataset **${qualDirection} en ${Math.abs(qualityDelta).toFixed(1)} puntos** (A: ${metricsA.quality}% -> B: ${metricsB.quality}%).`
    );
  }

  return {
    datasetA,
    datasetB,
    sharedColumns,
    newColumnsInB,
    missingInB,
    rowDifference,
    rowDifferencePct,
    columnDifference: datasetB.headers.length - datasetA.headers.length,
    qualityA: metricsA.quality,
    qualityB: metricsB.quality,
    qualityDelta,
    rowsA,
    rowsB,
    insights,
    tableRows,
  };
};