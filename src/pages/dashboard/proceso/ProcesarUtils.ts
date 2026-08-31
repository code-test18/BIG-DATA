import Papa from 'papaparse';
import type { ParsedDataset, DatasetComparison, ComparisonRow } from './ProcesarTypes';

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

        const rows = rawData.slice(1).map((row) =>
          headers.map((_, index) => String(row[index] ?? '').trim())
        );

        resolve({ name: file.name, headers, rows });
      },
      error: () => reject(new Error('No se pudo leer el CSV.')),
    });
  });

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

export const inferTypeFromValues = (values: string[]): string => {
  const usableValues = values.filter((value) => value.trim() !== '');
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

export const mean = (values: number[]): number => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

export const formatMetric = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  return value % 1 === 0 ? String(value) : value.toFixed(2);
};

export const buildComparison = async (datasetA: ParsedDataset, datasetB: ParsedDataset): Promise<DatasetComparison> => {
  const sharedColumns = datasetA.headers.filter((header) => datasetB.headers.includes(header));
  const newColumnsInB = datasetB.headers.filter((header) => !datasetA.headers.includes(header));
  const missingInB = datasetA.headers.filter((header) => !datasetB.headers.includes(header));
  
  const rowsA = datasetA.rows.length;
  const rowsB = datasetB.rows.length;
  const rowDifference = rowsB - rowsA;
  const rowDifferencePct = rowsA === 0 ? (rowsB === 0 ? 0 : 100) : (rowDifference / rowsA) * 100;

  const allColumns = Array.from(new Set([...datasetA.headers, ...datasetB.headers]));

  // Cálculo de métricas de calidad y duplicados por dataset
  const getDatasetMetrics = (dataset: ParsedDataset) => {
    if (dataset.rows.length === 0) return { quality: 0, duplicates: 0, nullRate: 0 };
    const allCells = dataset.rows.flat();
    const nullishCells = allCells.filter((cell) => ['', 'null', 'nil', 'none', 'n/a', 'na'].includes(cell.trim().toLowerCase())).length;

    const seenRows = new Set<string>();
    let duplicateRows = 0;

    dataset.rows.forEach((row) => {
      const rowKey = row.join('|');
      if (seenRows.has(rowKey)) {
        duplicateRows += 1;
        return;
      }
      seenRows.add(rowKey);
    });

    const totalCells = allCells.length || 1;
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

      const numericA = aColumnValues.map((value) => normalizeNumber(value)).filter((value): value is number => value !== null);
      const numericB = bColumnValues.map((value) => normalizeNumber(value)).filter((value): value is number => value !== null);

      // Exclusión explícita de identificadores, fechas y horas
      const isIgnoredForMedia = /id|identifier|code|codigo|date|fecha|time|hora/i.test(column);

      const typeA = inA ? (isIgnoredForMedia ? 'texto/fecha' : inferTypeFromValues(aColumnValues)) : '-';
      const typeB = inB ? (isIgnoredForMedia ? 'texto/fecha' : inferTypeFromValues(bColumnValues)) : '-';

      const canComputeMean = !isIgnoredForMedia && typeA !== 'fecha' && typeB !== 'fecha';

      const mediaA = numericA.length && canComputeMean ? mean(numericA) : 0;
      const mediaB = numericB.length && canComputeMean ? mean(numericB) : 0;

      const countNullsA = inA ? aColumnValues.filter((value) => ['', 'null', 'nil', 'none', 'n/a', 'na'].includes(value.trim().toLowerCase())).length : 0;
      const countNullsB = inB ? bColumnValues.filter((value) => ['', 'null', 'nil', 'none', 'n/a', 'na'].includes(value.trim().toLowerCase())).length : 0;

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

  // --- MOTOR DE INSIGHTS AVANZADOS ---
  const insights: string[] = [];

  // 1. Variación de Registros/Filas
  if (rowDifference !== 0) {
    const direction = rowDifference > 0 ? 'incrementó' : 'redujo';
    insights.push(
      `📊 **Volumen de datos:** El Dataset B ${direction} en **${Math.abs(rowDifference)} registros** (${Math.abs(rowDifferencePct).toFixed(1)}% respecto a A).`
    );
  } else {
    insights.push(`📊 **Volumen de datos:** Ambos datasets mantienen exactamente la misma cantidad de registros (${rowsA}).`);
  }

  // 2. Estructura de Columnas
  if (newColumnsInB.length > 0) {
    insights.push(`➕ **Nuevas columnas en B:** Se añadieron ${newColumnsInB.length} columna(s): \`${newColumnsInB.join(', ')}\`.`);
  }
  if (missingInB.length > 0) {
    insights.push(`⚠️ **Columnas eliminadas en B:** Desaparecieron ${missingInB.length} columna(s) presentes en A: \`${missingInB.join(', ')}\`.`);
  }

  // 3. Insight Comercial: Análisis Financiero / Facturación Total
  const salesColIndexA = datasetA.headers.findIndex((h) => /sales|total|income|revenue|ventas/i.test(h));
  const salesColIndexB = datasetB.headers.findIndex((h) => /sales|total|income|revenue|ventas/i.test(h));

  if (salesColIndexA !== -1 && salesColIndexB !== -1) {
    const totalA = datasetA.rows.reduce((sum, r) => sum + (normalizeNumber(r[salesColIndexA]) || 0), 0);
    const totalB = datasetB.rows.reduce((sum, r) => sum + (normalizeNumber(r[salesColIndexB]) || 0), 0);
    const diffSales = totalB - totalA;
    const diffSalesPct = totalA > 0 ? ((diffSales / totalA) * 100).toFixed(1) : '0';

    if (diffSales > 0) {
      insights.push(
        `💵 **Facturación Total:** Las ventas registradas subieron **+$${diffSales.toFixed(2)} USD** en B (+${diffSalesPct}% respecto a A).`
      );
    } else if (diffSales < 0) {
      insights.push(
        `🔻 **Facturación Total:** Las ventas cayeron **-$${Math.abs(diffSales).toFixed(2)} USD** en B (${diffSalesPct}% respecto a A).`
      );
    }
  }

  // 4. Insight Comercial: Categoría / Producto Líder en B
  const prodColIndex = datasetB.headers.findIndex((h) => /product|linea|categoria/i.test(h));
  if (prodColIndex !== -1 && salesColIndexB !== -1) {
    const salesByCategory: Record<string, number> = {};
    datasetB.rows.forEach((r) => {
      const cat = r[prodColIndex];
      const val = normalizeNumber(r[salesColIndexB]) || 0;
      if (cat) salesByCategory[cat] = (salesByCategory[cat] || 0) + val;
    });

    const topCategory = Object.entries(salesByCategory).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      insights.push(
        `🛍️ **Categoría Líder (Dataset B):** **"${topCategory[0]}"** es la de mayor volumen comercial con **$${topCategory[1].toFixed(2)} USD**.`
      );
    }
  }

  // 5. Insight Comercial: Perfil Demográfico (Género)
  const genderColIndex = datasetB.headers.findIndex((h) => /gender|genero/i.test(h));
  if (genderColIndex !== -1) {
    const females = datasetB.rows.filter((r) => /female|mujer/i.test(r[genderColIndex])).length;
    const total = datasetB.rows.length;
    if (total > 0) {
      const femalePct = ((females / total) * 100).toFixed(1);
      insights.push(`👥 **Perfil del Cliente:** El **${femalePct}%** de los registros en el Dataset B corresponden a clientes mujeres.`);
    }
  }

  // 6. Duplicados y Nulos
  if (metricsB.duplicates > metricsA.duplicates) {
    insights.push(
      `🚨 **Alerta de duplicados:** Dataset B contiene **${metricsB.duplicates} filas duplicadas** (Dataset A tenía ${metricsA.duplicates}).`
    );
  }

  const columnsWithMoreNulls = tableRows.filter(
    (r) => r.state === 'Compartida' && Number(r.nulosB) > Number(r.nulosA)
  );
  if (columnsWithMoreNulls.length > 0) {
    const colNames = columnsWithMoreNulls.map((c) => c.column).join(', ');
    insights.push(`⚠️ **Vacíos en aumento:** Se detectó un incremento de nulos en la(s) columna(s): \`${colNames}\`.`);
  }

  // 7. Inconsistencia de Tipos de Datos
  const typeMismatches = tableRows.filter(
    (r) => r.state === 'Compartida' && r.typeA !== '-' && r.typeB !== '-' && r.typeA !== r.typeB
  );
  if (typeMismatches.length > 0) {
    typeMismatches.forEach((m) => {
      insights.push(
        `🚨 **Incompatibilidad de Tipo:** La columna **"${m.column}"** cambió de tipo **${m.typeA}** (en A) a **${m.typeB}** (en B).`
      );
    });
  }

  // 8. Variación Significativa en Promedios/Medias
  tableRows
    .filter((r) => r.state === 'Compartida' && r.mediaA !== '—' && r.mediaB !== '—')
    .forEach((r) => {
      const mA = parseFloat(r.mediaA);
      const mB = parseFloat(r.mediaB);
      if (mA !== 0) {
        const diffPct = ((mB - mA) / mA) * 100;
        if (Math.abs(diffPct) >= 10) {
          const trend = diffPct > 0 ? 'subió' : 'cayó';
          insights.push(
            `📈 **Variación de promedio:** La media de **"${r.column}"** ${trend} un **${Math.abs(diffPct).toFixed(1)}%** (de ${r.mediaA} en A a ${r.mediaB} en B).`
          );
        }
      }
    });

  // 9. Score de Calidad
  if (qualityDelta !== 0) {
    const statusText = qualityDelta > 0 ? 'mejoró' : 'empeoró';
    insights.push(
      `✨ **Score de Calidad:** La calidad general del archivo ${statusText} **${Math.abs(qualityDelta).toFixed(1)} puntos** (A: ${metricsA.quality}% vs B: ${metricsB.quality}%).`
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