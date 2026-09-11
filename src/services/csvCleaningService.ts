import Papa from 'papaparse';
import type { CsvFile } from '../types/csv';

export interface CsvCleaningSummary {
  removedDuplicates: number;
  formattedValues: number;
  filledNulls: number;
  emptyValues: number;
  nullValues: number;
}

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

export type CleaningPhase = 'preparando' | 'procesando' | 'completado';

export interface CleaningProgress {
  phase: CleaningPhase;
  processedRows: number;
  totalRows: number;
  liveSummary: CsvCleaningSummary;
}

const CHUNK_SIZE = 200;

function isNullCell(cell: string): boolean {
  return ['null', 'nil', 'none'].includes(cell.trim().toLowerCase());
}

export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = results.data;
        const headers = (rawData[0] ?? []).map((header) => header.trim()).filter(Boolean);
        if (headers.length === 0) {
          reject(new Error('El CSV no contiene headers utilizables.'));
          return;
        }
        resolve({
          headers,
          rows: rawData.slice(1).map((row) => headers.map((_, index) => (row[index] ?? '').trim())),
        });
      },
      error: () => reject(new Error('No se pudo leer el archivo CSV.')),
    });
  });
}

/** Versión sin progreso — se mantiene para llamadas síncronas puntuales (ej. previews pequeños). */
export function cleanCsvRows(rows: string[][], fillValue: string): { rows: string[][]; summary: CsvCleaningSummary } {
  const seen = new Set<string>();
  let removedDuplicates = 0;
  let formattedValues = 0;
  let filledNulls = 0;
  let emptyValues = 0;
  let nullValues = 0; // antes quedaba hardcodeado en 0 al devolver el summary

  const cleanedRows = rows.reduce<string[][]>((result, row) => {
    const normalizedRow = row.map((cell) => {
      const trimmed = cell.trim();
      if (!trimmed || isNullCell(trimmed)) {
        filledNulls += 1;
        if (!trimmed) emptyValues += 1;
        else nullValues += 1; // distingue celda vacía de celda "null"/"nil"/"none"
        return fillValue;
      }
      if (trimmed !== cell) formattedValues += 1;
      return trimmed;
    });
    const rowKey = normalizedRow.join('\u001f');
    if (seen.has(rowKey)) {
      removedDuplicates += 1;
      return result;
    }
    seen.add(rowKey);
    result.push(normalizedRow);
    return result;
  }, []);

  return { rows: cleanedRows, summary: { removedDuplicates, formattedValues, filledNulls, emptyValues, nullValues } };
}

/**
 * Limpieza con progreso incremental — cede el hilo cada CHUNK_SIZE filas vía requestAnimationFrame
 * para que la UI se repinte y el componente que llama pueda mostrar una barra/log en tiempo real.
 */
export async function cleanCsvRowsWithProgress(
  rows: string[][],
  fillValue: string,
  onProgress: (progress: CleaningProgress) => void
): Promise<{ rows: string[][]; summary: CsvCleaningSummary }> {
  const total = rows.length;
  const seen = new Set<string>();
  let removedDuplicates = 0;
  let formattedValues = 0;
  let filledNulls = 0;
  let emptyValues = 0;
  let nullValues = 0;
  const cleanedRows: string[][] = [];

  onProgress({
    phase: 'preparando',
    processedRows: 0,
    totalRows: total,
    liveSummary: { removedDuplicates, formattedValues, filledNulls, emptyValues, nullValues },
  });
  await new Promise((resolve) => requestAnimationFrame(resolve));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const normalizedRow = row.map((cell) => {
      const trimmed = cell.trim();
      if (!trimmed || isNullCell(trimmed)) {
        filledNulls += 1;
        if (!trimmed) emptyValues += 1;
        else nullValues += 1;
        return fillValue;
      }
      if (trimmed !== cell) formattedValues += 1;
      return trimmed;
    });

    const rowKey = normalizedRow.join('\u001f');
    if (seen.has(rowKey)) {
      removedDuplicates += 1;
    } else {
      seen.add(rowKey);
      cleanedRows.push(normalizedRow);
    }

    if (i % CHUNK_SIZE === 0 || i === rows.length - 1) {
      onProgress({
        phase: 'procesando',
        processedRows: i + 1,
        totalRows: total,
        liveSummary: { removedDuplicates, formattedValues, filledNulls, emptyValues, nullValues },
      });
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }

  const finalSummary = { removedDuplicates, formattedValues, filledNulls, emptyValues, nullValues };
  onProgress({ phase: 'completado', processedRows: total, totalRows: total, liveSummary: finalSummary });
  return { rows: cleanedRows, summary: finalSummary };
}

export function inspectCsvRows(rows: string[][]): CsvCleaningSummary {
  const seen = new Set<string>();
  let duplicateRows = 0;
  let emptyValues = 0;
  let nullValues = 0;

  rows.forEach((row) => {
    row.forEach((cell) => {
      const trimmed = cell.trim();
      if (!trimmed) emptyValues += 1;
      if (isNullCell(trimmed)) nullValues += 1;
    });
    const key = row.join('\u001f');
    if (seen.has(key)) duplicateRows += 1;
    seen.add(key);
  });

  return { removedDuplicates: duplicateRows, formattedValues: 0, filledNulls: 0, emptyValues, nullValues };
}

/** Reconstruye un File CSV real a partir de headers+rows ya parseados/limpiados en el navegador. */
export function buildCsvFile(name: string, headers: string[], rows: string[][]): File {
  const csvText = Papa.unparse({ fields: headers, data: rows });
  return new File([csvText], name, { type: 'text/csv' });
}

export function createCsvFile(name: string, parsed: ParsedCsv, rows: string[][], isClean = false): CsvFile {
  return {
    id: crypto.randomUUID(),
    name,
    headers: parsed.headers,
    rows,
    uploadedAt: new Date().toLocaleTimeString(),
    isClean,
  };
}