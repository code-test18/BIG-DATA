import { useState } from 'react';
import { processAnalysis, validateAnalysis } from '../services/analysisService';
import type { AnalysisRequest, AnalysisResult } from '../types/analysis';
import type { CsvFile } from '../types/csv';

export function useAnalysis() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async (file: CsvFile | undefined, request: AnalysisRequest): Promise<AnalysisResult | null> => {
    const validation = validateAnalysis(file, request.target, request.columns);
    if (!validation.valid || !file) {
      setError(validation.message ?? 'La configuración del análisis no es válida.');
      setStatus('error');
      return null;
    }

    setError(null);
    setStatus('loading');
    setIsProcessing(true);
    try {
      await Promise.resolve();
      const result = processAnalysis(file, request);
      setStatus('success');
      return result;
    } catch {
      setError('No se pudo procesar el CSV. Revisa los datos e inténtalo de nuevo.');
      setStatus('error');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return { runAnalysis, status, isProcessing, error, clearError: () => { setError(null); setStatus('idle'); } };
}
