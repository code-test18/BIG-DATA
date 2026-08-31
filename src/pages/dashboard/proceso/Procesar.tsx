import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAnalysis } from '../../../hooks/useAnalysis';
import type { AnalysisRequest, AnalysisSelection } from '../../../types/analysis';
import type { DashboardContextType } from '../../../types/csv';
import type { ParsedDataset, DatasetComparison } from './ProcesarTypes';
import { buildComparison } from './ProcesarUtils';
import InsightsView from './InsightsView';

export default function Procesar() {
  const { files, activeFileId, setActiveFileId, setAnalysisResult } = useOutletContext<DashboardContextType>();
  const navigate = useNavigate();
  const [selection, setSelection] = useState<AnalysisSelection>({});
  const [hasProcessed, setHasProcessed] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'report' | 'insights'>('report');

  const [datasetA, setDatasetA] = useState<ParsedDataset | null>(null);
  const [datasetB, setDatasetB] = useState<ParsedDataset | null>(null);
  const [datasetAName, setDatasetAName] = useState<string>('Sin archivo');
  const [datasetBName, setDatasetBName] = useState<string>('Sin archivo');
  const [uploadingDataset, setUploadingDataset] = useState<'A' | 'B' | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<DatasetComparison | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const { runAnalysis, status, error, clearError } = useAnalysis();

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

  const cleanFiles = files.filter((file) => file.isClean);
  const activeFile = cleanFiles.find((file) => file.id === activeFileId) ?? cleanFiles[0];

  const handleFileChange = (fileId: string) => {
    setActiveFileId(fileId);
    setSelection({});
    setHasProcessed(false);
    setSelectionError(null);
    clearError();
  };

  const handleColumnChange = (role: 'category' | 'metric', value: string) => {
    setSelection((current) => ({ ...current, [role]: value }));
    setHasProcessed(false);
    setSelectionError(null);
    clearError();
  };

  const handleProcess = async () => {
    if (!activeFile) return;
    if (!selection.category || !selection.metric) {
      setSelectionError('Selecciona una categoría y una métrica antes de iniciar el análisis.');
      return;
    }
    const request: AnalysisRequest = { target: 'dynamic_mapping', columns: selection };
    const result = await runAnalysis(activeFile, request);
    if (result) {
      setAnalysisResult(result);
      setHasProcessed(true);
      localStorage.setItem('reporte_config', JSON.stringify({ ejeX: selection.category, ejeY: selection.metric }));
      if (activeFile.rows) {
        localStorage.setItem('uploaded_csv_data', JSON.stringify(activeFile.rows));
      }
    }
  };

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

        {cleanFiles.length === 0 ? (
          <div className="empty-state">
            <p>No hay CSV limpios disponibles. Primero carga y limpia un archivo.</p>
          </div>
        ) : (
          <div>
            <div className="tab-switcher" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <button
                type="button"
                className={`btn ${activeTab === 'report' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('report')}
              >
                Generar reporte
              </button>
              <button
                type="button"
                className={`btn ${activeTab === 'insights' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('insights')}
              >
                Insights
              </button>
            </div>

            {activeTab === 'report' && (
              <section className="analysis-panel">
                <div className="step-heading">
                  <span>01</span>
                  <div>
                    <h3>Generar reporte</h3>
                    <p>Selecciona un CSV limpio y define qué columnas quieres analizar.</p>
                  </div>
                </div>

                <label className="form-group">
                  <span className="form-label">CSV limpio</span>
                  <select className="form-input" value={activeFile?.id ?? ''} onChange={(e) => handleFileChange(e.target.value)}>
                    {cleanFiles.map((file) => (
                      <option key={file.id} value={file.id}>
                        {file.name} · {file.rows.length} registros
                      </option>
                    ))}
                  </select>
                </label>

                {activeFile && (
                  <div className="analysis-fields">
                    <label className="form-group">
                      <span className="form-label">Agrupar por / Categoría</span>
                      <select className="form-input" value={selection.category ?? ''} onChange={(e) => handleColumnChange('category', e.target.value)}>
                        <option value="">Selecciona un header</option>
                        {activeFile.headers.map((header) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </label>
                    <label className="form-group">
                      <span className="form-label">Medir / Métrica</span>
                      <select className="form-input" value={selection.metric ?? ''} onChange={(e) => handleColumnChange('metric', e.target.value)}>
                        <option value="">Selecciona un header</option>
                        {activeFile.headers.map((header) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                {(error || selectionError) && <div className="alert-error">{error || selectionError}</div>}

                <button className="btn btn-primary process-btn" onClick={handleProcess} disabled={status === 'loading'}>
                  {status === 'loading' ? 'Procesando...' : 'Iniciar Análisis'}
                </button>

                {status === 'success' && hasProcessed && (
                  <button className="btn btn-secondary report-cta" onClick={() => navigate('/dashboard/reportes')}>
                    Generar Reporte →
                  </button>
                )}
              </section>
            )}

            {activeTab === 'insights' && (
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
            )}
          </div>
        )}
      </div>
    </>
  );
}