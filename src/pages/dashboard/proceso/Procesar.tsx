import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAnalysis } from '../../../hooks/useAnalysis';
import type { AnalysisRequest, AnalysisSelection } from '../../../types/analysis';
import type { DashboardContextType } from '../../../types/csv';
import type { ParsedDataset, DatasetComparison } from './ProcesarTypes';
import { buildComparison } from './ProcesarUtils';
import InsightsView from './InsightsView';

export default function Procesar() {
  const { files, activeFileId, setActiveFileId, analysisResult, setAnalysisResult } = useOutletContext<DashboardContextType>();
  const [selection, setSelection] = useState<AnalysisSelection>({});
  const [analizado, setAnalizado] = useState(false);
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
    setAnalizado(false);
    setSelectionError(null);
    clearError();
  };

  const handleColumnChange = (role: 'category' | 'metric', value: string) => {
    setSelection((current) => ({ ...current, [role]: value }));
    setAnalizado(false);
    setSelectionError(null);
    clearError();
  };

  const handleProcess = async () => {
    if (!activeFile) return;
    if (!selection.category || !selection.metric) {
      setAnalizado(false);
      setSelectionError('Selecciona una categoría y una métrica antes de iniciar el análisis.');
      return;
    }

    setSelectionError(null);
    setAnalizado(false);

    const request: AnalysisRequest = { target: 'dynamic_mapping', columns: selection };
    const result = await runAnalysis(activeFile, request);

    if (result) {
      setAnalysisResult(result);
      setAnalizado(true);
      localStorage.setItem('reporte_config', JSON.stringify({ ejeX: selection.category, ejeY: selection.metric }));
      if (activeFile.rows) {
        localStorage.setItem('uploaded_csv_data', JSON.stringify(activeFile.rows));
      }
    }
  };

  const handleExportReport = () => {
    if (!analysisResult) return;

    const reportToSave = {
      id: crypto.randomUUID(),
      tipo: 'ventas',
      nombreArchivo: analysisResult.sourceFileName,
      nombre: `Reporte - ${analysisResult.sourceFileName}`,
      fecha: new Date().toLocaleString(),
      createdAt: new Date().toISOString(),
      resumen: `Análisis realizado sobre ${analysisResult.sourceFileName} usando la categoría ${analysisResult.configuration.columns.category} y la métrica ${analysisResult.configuration.columns.metric}.`,
      metricas: analysisResult.metrics,
      mapeo: {
        fecha: analysisResult.configuration.columns.category,
        categoria: analysisResult.configuration.columns.category,
        monto: analysisResult.configuration.columns.metric,
        cantidad: '',
      },
      graficoPorCategoria: analysisResult.series.map((item) => ({
        label: item.label,
        total: item.value,
      })),
      graficoPorFecha: analysisResult.series.map((item) => ({
        label: item.label,
        total: item.value,
      })),
      participacionCategoria: analysisResult.series.map((item) => ({
        categoria: item.label,
        porcentaje: Number(((item.value / Math.max(analysisResult.series.reduce((sum, current) => sum + current.value, 0), 1)) * 100).toFixed(2)),
      })),
    };

    const savedReports = JSON.parse(localStorage.getItem('reportes_ventas') ?? '[]');
    localStorage.setItem('reportes_ventas', JSON.stringify([...savedReports, reportToSave]));
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
                Analizar 
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
                  {status === 'loading' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="loading-spinner" aria-label="Cargando" />
                      Procesando...
                    </span>
                  ) : (
                    'Iniciar Análisis'
                  )}
                </button>

                {analizado && analysisResult && (
                  <section className="report-section" style={{ marginTop: '1.5rem' }}>
                    <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <div className="eyebrow">Resultado del análisis</div>
                        <h3 style={{ margin: '0.35rem 0 0' }}>{analysisResult.title}</h3>
                        <p style={{ marginTop: '0.4rem', color: '#64748b' }}>
                          Fuente: {analysisResult.sourceFileName} · {analysisResult.generatedAt}
                        </p>
                      </div>

                      <button className="btn btn-secondary report-cta" onClick={handleExportReport}>
                        Exportar Reporte
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                      {analysisResult.metrics.map((metric) => (
                        <div key={metric.label} className="card metric-card" style={{ background: '#fff', border: '1px solid #dbe4ef', borderRadius: '12px', padding: '1rem' }}>
                          <span style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            {metric.label}
                          </span>
                          <strong style={{ display: 'block', marginTop: '0.6rem', fontSize: '1.5rem', color: '#0f172a' }}>
                            {metric.value}
                          </strong>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '1.75rem', height: '320px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analysisResult.series} margin={{ top: 8, right: 12, left: 0, bottom: 12 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ef" />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#475569' }} angle={-18} textAnchor="end" height={60} />
                          <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                          <Tooltip formatter={(value: unknown) => {
                            const raw = Array.isArray(value) ? value[0] : value;
                            const numeric = Number(raw ?? 0);
                            return [numeric.toLocaleString(), 'Valor'] as [string, string];
                          }} />
                          <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #dbe4ef', borderRadius: '10px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <strong style={{ color: '#0f172a' }}>Configuración aplicada</strong>
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Registros analizados: {analysisResult.processedRows}</span>
                      </div>
                      <div className="config-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.8rem' }}>
                        <span>Categoría: {analysisResult.configuration.columns.category}</span>
                        <span>Métrica: {analysisResult.configuration.columns.metric}</span>
                        <span>Target: {analysisResult.target}</span>
                      </div>
                    </div>
                  </section>
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