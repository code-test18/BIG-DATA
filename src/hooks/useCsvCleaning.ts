import { useState } from 'react';
import { cleanCsvRows, createCsvFile, inspectCsvRows, parseCsvFile, type CsvCleaningSummary } from '../services/csvCleaningService';
import type { CsvFile } from '../types/csv';

export function useCsvCleaning() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CsvCleaningSummary | null>(null);

  const inspectFile = async (file: File): Promise<CsvFile | null> => {
    setStatus('loading');
    setError(null);
    try {
      const parsed = await parseCsvFile(file);
      const inspectedFile = createCsvFile(file.name, parsed, parsed.rows);
      setSummary(inspectCsvRows(parsed.rows));
      setStatus('success');
      return inspectedFile;
    } catch (cleaningError) {
      setError(cleaningError instanceof Error ? cleaningError.message : 'No se pudo limpiar el CSV.');
      setStatus('error');
      return null;
    }
  };

  const cleanFile = (file: CsvFile, fillValue: string): CsvFile => {
    const cleaned = cleanCsvRows(file.rows, fillValue);
    setSummary(cleaned.summary);
    setStatus('success');
    return { ...file, rows: cleaned.rows, isClean: true };
  };

  return { inspectFile, cleanFile, status, error, summary };
}
