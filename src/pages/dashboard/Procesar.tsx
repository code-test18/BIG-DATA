import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAnalysis } from '../../hooks/useAnalysis';
import type { AnalysisRequest, AnalysisSelection } from '../../types/analysis';
import type { DashboardContextType } from '../../types/csv';

type ParsedDataset = {
  name: string;
  headers: string[];
  rows: string[][];
};

type ComparisonRow = {
  column: string;
  state: 'Compartida' | 'Nueva en B' | 'Eliminada en B';
  typeA: string;
  typeB: string;
  mediaA: string;
  mediaB: string;
  nulosA: number;
  nulosB: number;
};

type DatasetComparison = {
  datasetA: ParsedDataset;
  datasetB: ParsedDataset;
  sharedColumns: string[];
  newColumnsInB: string[];
  missingInB: string[];
  rowDifference: number;
  rowDifferencePct: number;
  columnDifference: number;
  qualityA: number;
  qualityB: number;
  qualityDelta: number;
  rowsA: number;
  rowsB: number;
  insights: string[];
  tableRows: ComparisonRow[];
};

const parseCsvDataset = (file: File): Promise<ParsedDataset> =>
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

const normalizeNumber = (value: string): number | null => {
  if (!value) return null;

  const cleaned = value.replace(/\s+/g, '').replace(/[^0-9,.-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === ',') return null;

  const normalized = cleaned.includes(',') && cleaned.includes('.')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(',', '.');

  const numericValue = Number(normalized);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const inferTypeFromValues = (values: string[]): string => {
  const usableValues = values.filter((value) => value.trim() !== '');
  if (usableValues.length === 0) return 'desconocido';

  const numericValues = usableValues.map((value) => normalizeNumber(value)).filter((value) => value !== null);
  if (numericValues.length === usableValues.length) return 'numérico';

  const booleanValues = usableValues
    .map((value) => value.trim().toLowerCase())
    .filter((value) => ['true', 'false', 'yes', 'no', 'si', 'no'].includes(value));
  if (booleanValues.length === usableValues.length) return 'boolean';

  const dateValues = usableValues.filter((value) => !Number.isNaN(Date.parse(value)));
  if (dateValues.length === usableValues.length) return 'fecha';

  return 'texto';
};

const mean = (values: number[]): number => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

const formatMetric = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  return value % 1 === 0 ? String(value) : value.toFixed(2);
};

const buildComparison = async (datasetA: ParsedDataset, datasetB: ParsedDataset): Promise<DatasetComparison> => {
  const sharedColumns = datasetA.headers.filter((header) => datasetB.headers.includes(header));
  const newColumnsInB = datasetB.headers.filter((header) => !datasetA.headers.includes(header));
  const missingInB = datasetA.headers.filter((header) => !datasetB.headers.includes(header));
  const rowsA = datasetA.rows.length;
  const rowsB = datasetB.rows.length;
  const rowDifference = rowsB - rowsA;
  const rowDifferencePct = rowsA === 0 ? (rowsB === 0 ? 0 : 100) : (rowDifference / rowsA) * 100;

  const allColumns = Array.from(new Set([...datasetA.headers, ...datasetB.headers]));

  const qualityFromDataset = (dataset: ParsedDataset) => {
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
    const duplicatePenalty = duplicateRows * 2;
    return Math.max(0, 100 - nullRate - duplicatePenalty);
  };

  const qualityA = qualityFromDataset(datasetA);
  const qualityB = qualityFromDataset(datasetB);
  const qualityDelta = qualityB - qualityA;

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

      const mediaA = numericA.length ? mean(numericA) : 0;
      const mediaB = numericB.length ? mean(numericB) : 0;

      tableRows.push({
        column,
        state,
        typeA: inA ? inferTypeFromValues(aColumnValues) : '-',
        typeB: inB ? inferTypeFromValues(bColumnValues) : '-',
        mediaA: inA && numericA.length ? formatMetric(mediaA) : '—',
        mediaB: inB && numericB.length ? formatMetric(mediaB) : '—',
        nulosA: inA ? aColumnValues.filter((value) => ['', 'null', 'nil', 'none', 'n/a', 'na'].includes(value.trim().toLowerCase())).length : 0,
        nulosB: inB ? bColumnValues.filter((value) => ['', 'null', 'nil', 'none', 'n/a', 'na'].includes(value.trim().toLowerCase())).length : 0,
      });
    });

    if (index + chunkSize < allColumns.length) {
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(null)));
    }
  }

  const insights = [
    rowDifference > 0
      ? `El dataset B tiene ${Math.abs(rowDifference)} fila(s) más que A (${rowDifferencePct.toFixed(1)}%).`
      : rowDifference < 0
        ? `El dataset A tiene ${Math.abs(rowDifference)} fila(s) más que B (${Math.abs(rowDifferencePct).toFixed(1)}%).`
        : 'Ambos datasets tienen la misma cantidad de filas.',
    newColumnsInB.length > 0
      ? `${newColumnsInB.length} columna(s) nueva(s) aparecen solo en B.`
      : 'No aparecen columnas nuevas en B respecto a A.',
    missingInB.length > 0
      ? `${missingInB.length} columna(s) de A desaparecieron en B.`
      : 'No faltan columnas de A en B.',
    qualityDelta > 0
      ? `La calidad de datos mejoró ${qualityDelta.toFixed(1)} puntos en B.`
      : qualityDelta < 0
        ? `La calidad de datos empeoró ${Math.abs(qualityDelta).toFixed(1)} puntos en B.`
        : 'La calidad de datos se mantiene estable entre ambos datasets.',
  ];

  return {
    datasetA,
    datasetB,
    sharedColumns,
    newColumnsInB,
    missingInB,
    rowDifference,
    rowDifferencePct,
    columnDifference: datasetB.headers.length - datasetA.headers.length,
    qualityA,
    qualityB,
    qualityDelta,
    rowsA,
    rowsB,
    insights,
    tableRows,
  };
};

function Procesar() {
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

  // Estilos reutilizables
  const cardStyle = { background: '#fff', border: '1px solid #dbe4ef', borderRadius: '12px', padding: '1rem' };
  const thStyle = { padding: '0.75rem', borderBottom: '1px solid #dbe4ef', textAlign: 'left' as const };
  const tdStyle = { padding: '0.75rem', borderBottom: '1px solid #eef2f7' };
  const metricCardStyle = { ...cardStyle, margin: 0, color: '#64748b' };
  const barContainerStyle = { width: '100%', maxWidth: '60px', height: '120px', display: 'flex' as const, alignItems: 'flex-end' as const, justifyContent: 'center' as const, background: '#f8fafc', borderRadius: '8px', padding: '0.3rem' };

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

      // GUARDA LA CONFIGURACIÓN Y EL CSV EN LOCALSTORAGE AL PROCESAR CON ÉXITO
      localStorage.setItem(
        'reporte_config',
        JSON.stringify({ ejeX: selection.category, ejeY: selection.metric })
      );
      
      // Si activeFile contiene las filas, guarda los datos para que Reportes.tsx los lea
      if (activeFile.rows) {
        localStorage.setItem('uploaded_csv_data', JSON.stringify(activeFile.rows));
      }
    }
  };

  const renderLoadingBar = (color: string) => (
    <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '999px',
          background: `linear-gradient(90deg, ${color} 0%, #dbeafe 50%, ${color} 100%)`,
          backgroundSize: '200% 100%',
          animation: 'loading-scan 1.2s linear infinite',
        }}
      />
    </div>
  );

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
                <select
                  className="form-input"
                  value={activeFile?.id ?? ''}
                  onChange={(event) => handleFileChange(event.target.value)}
                >
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
                    <select
                      className="form-input"
                      value={selection.category ?? ''}
                      onChange={(event) => handleColumnChange('category', event.target.value)}
                    >
                      <option value="">Selecciona un header</option>
                      {activeFile.headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-group">
                    <span className="form-label">Medir / Métrica</span>
                    <select
                      className="form-input"
                      value={selection.metric ?? ''}
                      onChange={(event) => handleColumnChange('metric', event.target.value)}
                    >
                      <option value="">Selecciona un header</option>
                      {activeFile.headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
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
            <section className="analysis-panel" style={{ display: 'grid', gap: '1.25rem' }}>
              <div className="step-heading">
                <span>02</span>
                <div>
                  <h3>Insights</h3>
                  <p>Carga un Dataset A y un Dataset B para detectar automáticamente qué cambió entre ambos archivos.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <span className="form-label">Dataset A (base)</span>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: 'fit-content', cursor: 'pointer' }}
                      disabled={uploadingDataset === 'A'}
                      onClick={() => document.getElementById('dataset-a-upload')?.click()}
                    >
                      Seleccionar CSV
                    </button>
                    <input
                      id="dataset-a-upload"
                      className="form-input"
                      type="file"
                      accept=".csv"
                      style={{ display: 'none' }}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        setUploadingDataset('A');
                        try {
                          setCompareError(null);
                          setDatasetA(await parseCsvDataset(file));
                          setDatasetAName(file.name);
                        } catch (loadError) {
                          setCompareError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el Dataset A.');
                        } finally {
                          setUploadingDataset((current) => (current === 'A' ? null : current));
                        }
                        event.target.value = '';
                      }}
                    />
                    {uploadingDataset === 'A' && renderLoadingBar('#2563eb')}
                    <small style={{ color: '#334155', fontWeight: 600 }}>Archivo: {datasetAName}</small>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <span className="form-label">Dataset B (comparado)</span>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: 'fit-content', cursor: 'pointer' }}
                      disabled={uploadingDataset === 'B'}
                      onClick={() => document.getElementById('dataset-b-upload')?.click()}
                    >
                      Seleccionar CSV
                    </button>
                    <input
                      id="dataset-b-upload"
                      className="form-input"
                      type="file"
                      accept=".csv"
                      style={{ display: 'none' }}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        setUploadingDataset('B');
                        try {
                          setCompareError(null);
                          setDatasetB(await parseCsvDataset(file));
                          setDatasetBName(file.name);
                        } catch (loadError) {
                          setCompareError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el Dataset B.');
                        } finally {
                          setUploadingDataset((current) => (current === 'B' ? null : current));
                        }
                        event.target.value = '';
                      }}
                    />
                    {uploadingDataset === 'B' && renderLoadingBar('#10b981')}
                    <small style={{ color: '#334155', fontWeight: 600 }}>Archivo: {datasetBName}</small>
                  </div>
                </div>
              </div>

              {compareError && <div className="alert-error">{compareError}</div>}

              {isComparing && (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <strong style={{ color: '#334155' }}>Comparando datasets...</strong>
                  {renderLoadingBar('#2563eb')}
                </div>
              )}

              {comparison && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div className="card" style={cardStyle}>
                      <h4 style={metricCardStyle}>Columnas compartidas</h4>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#2563eb' }}>{comparison.sharedColumns.length}</p>
                    </div>
                    <div className="card" style={cardStyle}>
                      <h4 style={metricCardStyle}>Diferencia de filas</h4>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#10b981' }}>
                        {comparison.rowDifference > 0 ? '+' : ''}{comparison.rowDifference}
                      </p>
                    </div>
                    <div className="card" style={cardStyle}>
                      <h4 style={metricCardStyle}>% filas difer.</h4>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b' }}>
                        {Math.abs(comparison.rowDifferencePct).toFixed(1)}%
                      </p>
                    </div>
                    <div className="card" style={cardStyle}>
                      <h4 style={metricCardStyle}>Calidad neta</h4>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#ef4444' }}>
                        {comparison.qualityDelta >= 0 ? '+' : ''}{comparison.qualityDelta.toFixed(1)} pts
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {comparison.insights.map((insight, index) => (
                      <div key={index} className="alert-success" style={{ margin: 0 }}>
                        {insight}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                    <div style={cardStyle}>
                      <h4 style={{ marginTop: 0 }}>Filas por dataset</h4>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '180px', paddingTop: '1rem' }}>
                        {[
                          { label: 'A', value: comparison.rowsA },
                          { label: 'B', value: comparison.rowsB },
                        ].map((item) => {
                          const maxValue = Math.max(comparison.rowsA, comparison.rowsB, 1);
                          const height = `${(item.value / maxValue) * 100}%`;
                          return (
                            <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={barContainerStyle}>
                                <div style={{ width: '100%', height, borderRadius: '8px 8px 0 0', background: item.label === 'A' ? '#2563eb' : '#10b981' }} />
                              </div>
                              <strong>{item.label}</strong>
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={cardStyle}>
                      <h4 style={{ marginTop: 0 }}>Columnas por dataset</h4>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '180px', paddingTop: '1rem' }}>
                        {[
                          { label: 'A', value: comparison.datasetA.headers.length },
                          { label: 'B', value: comparison.datasetB.headers.length },
                        ].map((item) => {
                          const maxValue = Math.max(comparison.datasetA.headers.length, comparison.datasetB.headers.length, 1);
                          const height = `${(item.value / maxValue) * 100}%`;
                          return (
                            <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={barContainerStyle}>
                                <div style={{ width: '100%', height, borderRadius: '8px 8px 0 0', background: item.label === 'A' ? '#8b5cf6' : '#f59e0b' }} />
                              </div>
                              <strong>{item.label}</strong>
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #dbe4ef', borderRadius: '12px', overflow: 'hidden' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={thStyle}>Columnas</th>
                          <th style={thStyle}>Estado</th>
                          <th style={thStyle}>Tipo A - B</th>
                          <th style={thStyle}>Media A</th>
                          <th style={thStyle}>Media B</th>
                          <th style={thStyle}>Nulos A</th>
                          <th style={thStyle}>Nulos B</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparison.tableRows.map((row) => (
                          <tr key={row.column}>
                            <td style={tdStyle}>{row.column}</td>
                            <td style={tdStyle}>{row.state}</td>
                            <td style={tdStyle}>{row.typeA} - {row.typeB}</td>
                            <td style={tdStyle}>{row.mediaA}</td>
                            <td style={tdStyle}>{row.mediaB}</td>
                            <td style={tdStyle}>{row.nulosA}</td>
                            <td style={tdStyle}>{row.nulosB}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {!comparison && !compareError && (
                <div className="empty-state">
                  <p>Sube dos CSV para comparar estructura, tipos, calidad y métricas.</p>
                </div>
              )}
            </section>
          )}
        </div>
      )}
      </div>
    </>
  );
}

export default Procesar;