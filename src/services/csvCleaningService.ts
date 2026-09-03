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

export function cleanCsvRows(rows: string[][], fillValue: string): { rows: string[][]; summary: CsvCleaningSummary } {
  const seen = new Set<string>();
  let removedDuplicates = 0;
  let formattedValues = 0;
  let filledNulls = 0;
  let emptyValues = 0;

  const cleanedRows = rows.reduce<string[][]>((result, row) => {
    const normalizedRow = row.map((cell) => {
      const trimmed = cell.trim();
      if (!trimmed || isNullCell(trimmed)) {
        filledNulls += 1;
        if (!trimmed) emptyValues += 1;
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

  return { rows: cleanedRows, summary: { removedDuplicates, formattedValues, filledNulls, emptyValues, nullValues: 0 } };
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
