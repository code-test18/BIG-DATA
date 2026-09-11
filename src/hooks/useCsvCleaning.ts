import { useState } from 'react';
import {
  cleanCsvRowsWithProgress,
  createCsvFile,
  inspectCsvRows,
  parseCsvFile,
  type CleaningProgress,
  type CsvCleaningSummary,
} from '../services/csvCleaningService';
import type { CsvFile } from '../types/csv';

export function useCsvCleaning() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CsvCleaningSummary | null>(null);
  const [progress, setProgress] = useState<CleaningProgress | null>(null);

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
      setError(cleaningError instanceof Error ? cleaningError.message : 'No se pudo leer el CSV.');
      setStatus('error');
      return null;
    }
  };

  /**
   * ¡OJO! Antes era síncrona (`const cleaned = cleanFile(...)`). Ahora es async porque muestra
   * progreso en tiempo real. Si en tu componente la llamabas sin `await`, hay que agregarlo,
   * o el archivo limpio que recibes de vuelta será una Promise sin resolver, no un CsvFile.
   */
  const cleanFile = async (file: CsvFile, fillValue: string): Promise<CsvFile | null> => {
    setStatus('loading');
    setError(null);
    setProgress(null);
    try {
      const cleaned = await cleanCsvRowsWithProgress(file.rows, fillValue, setProgress);
      setSummary(cleaned.summary);
      setStatus('success');
      return { ...file, rows: cleaned.rows, isClean: true };
    } catch (cleaningError) {
      setError(cleaningError instanceof Error ? cleaningError.message : 'No se pudo limpiar el CSV.');
      setStatus('error');
      return null;
    } finally {
      // deja el progreso final visible un instante; el componente decide cuándo ocultarlo
    }
  };

  return { inspectFile, cleanFile, status, error, summary, progress };
}