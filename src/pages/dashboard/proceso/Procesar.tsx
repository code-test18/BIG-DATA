import { useEffect, useState } from 'react';
import type { ParsedDataset, DatasetComparison } from './ProcesarTypes';
import { buildComparison } from './ProcesarUtils';
import InsightsView from './InsightsView';

export default function Procesar() {
  const [datasetA, setDatasetA] = useState<ParsedDataset | null>(null);
  const [datasetB, setDatasetB] = useState<ParsedDataset | null>(null);
  const [datasetAName, setDatasetAName] = useState<string>('Sin archivo');
  const [datasetBName, setDatasetBName] = useState<string>('Sin archivo');
  const [uploadingDataset, setUploadingDataset] = useState<'A' | 'B' | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<DatasetComparison | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    if (!datasetA || !datasetB) {
      setComparison(null);
      return;
    }

    let cancelled = false;
    setIsComparing(true);
    setComparison(null);

    const runComparison = async () => {
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(null)));
      const nextComparison = await buildComparison(datasetA, datasetB);
      if (!cancelled) {
        setComparison(nextComparison);
        setIsComparing(false);
      }
    };

    void runComparison();

    return () => {
      cancelled = true;
      setIsComparing(false);
    };
  }, [datasetA, datasetB]);

  return (
    <>
      <style>{`
        @keyframes loading-scan {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="dashboard-page">
        <h2>Procesar y analizar</h2>
        <p>Selecciona un CSV limpio y relaciona una categoría con una métrica numérica.</p>

        <InsightsView
          datasetAName={datasetAName}
          datasetBName={datasetBName}
          uploadingDataset={uploadingDataset}
          compareError={compareError}
          comparison={comparison}
          isComparing={isComparing}
          setDatasetA={setDatasetA}
          setDatasetB={setDatasetB}
          setDatasetAName={setDatasetAName}
          setDatasetBName={setDatasetBName}
          setUploadingDataset={setUploadingDataset}
          setCompareError={setCompareError}
        />
      </div>
    </>
  );
}