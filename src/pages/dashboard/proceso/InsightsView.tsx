import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeDollarSign,
  BarChart3,
  Database,
  Layers3,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useDatasets } from '../../../hooks/useDatasets';
import type { DatasetComparison, ParsedDataset } from './ProcesarTypes';

interface InsightsViewProps {
  datasetAName: string;
  datasetBName: string;
  uploadingDataset: 'A' | 'B' | null;
  compareError: string | null;
  comparison: DatasetComparison | null;
  isComparing: boolean;
  setDatasetA: (d: ParsedDataset | null) => void;
  setDatasetB: (d: ParsedDataset | null) => void;
  setDatasetAName: (name: string) => void;
  setDatasetBName: (name: string) => void;
  setUploadingDataset: React.Dispatch<React.SetStateAction<'A' | 'B' | null>>;
  setCompareError: (err: string | null) => void;
}

const cardStyle = { background: '#fff', border: '1px solid #dbe4ef', borderRadius: '12px', padding: '1rem' };
const thStyle = { padding: '0.75rem', borderBottom: '1px solid #dbe4ef', textAlign: 'left' as const, fontSize: '0.85rem', color: '#475569' };
const tdStyle = { padding: '0.75rem', borderBottom: '1px solid #eef2f7', fontSize: '0.875rem' };
const metricCardStyle = { ...cardStyle, margin: 0, color: '#64748b', fontSize: '0.875rem' };
const barContainerStyle = { width: '100%', maxWidth: '60px', height: '120px', display: 'flex' as const, alignItems: 'flex-end' as const, justifyContent: 'center' as const, background: '#f8fafc', borderRadius: '8px', padding: '0.3rem' };

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

const getInsightMeta = (insight: string): { tone: 'info' | 'success' | 'warning' | 'danger'; icon: LucideIcon } => {
  const normalized = insight.toLowerCase();

  if (normalized.includes('facturación') || normalized.includes('ventas')) {
    return { tone: 'success', icon: BadgeDollarSign };
  }
  if (normalized.includes('duplicados') || normalized.includes('vacíos') || normalized.includes('incompatibilidad') || normalized.includes('eliminadas') || normalized.includes('columnas')) {
    return { tone: 'danger', icon: AlertTriangle };
  }
  if (normalized.includes('perfil del cliente') || normalized.includes('categoría líder')) {
    return { tone: 'info', icon: Users };
  }
  if (normalized.includes('variación de promedio') || normalized.includes('volumen de datos')) {
    return { tone: 'info', icon: BarChart3 };
  }
  if (normalized.includes('calidad') || normalized.includes('score')) {
    return { tone: 'success', icon: Sparkles };
  }
  if (normalized.includes('nuevas columnas') || normalized.includes('columnas') || normalized.includes('datos')) {
    return { tone: 'warning', icon: Layers3 };
  }

  return { tone: 'info', icon: Database };
};

export default function InsightsView({
  datasetAName,
  datasetBName,
  uploadingDataset,
  compareError,
  comparison,
  isComparing,
  setDatasetA,
  setDatasetB,
  setDatasetAName,
  setDatasetBName,
  setUploadingDataset,
  setCompareError,
}: InsightsViewProps) {
  const navigate = useNavigate();
  const { cleanDatasets } = useDatasets();
  const [selectedDatasetAId, setSelectedDatasetAId] = useState('');
  const [selectedDatasetBId, setSelectedDatasetBId] = useState('');

  useEffect(() => {
    if (!cleanDatasets.length) {
      setSelectedDatasetAId('');
      setSelectedDatasetBId('');
      setCompareError(null);
      setUploadingDataset(null);
      return;
    }

    if (!selectedDatasetAId || !cleanDatasets.some((item) => item.id === selectedDatasetAId)) {
      setSelectedDatasetAId(cleanDatasets[0].id);
    }

    if (!selectedDatasetBId || !cleanDatasets.some((item) => item.id === selectedDatasetBId)) {
      setSelectedDatasetBId(cleanDatasets[1]?.id ?? cleanDatasets[0].id);
    }

    if (uploadingDataset) {
      setCompareError(null);
    }
  }, [cleanDatasets, selectedDatasetAId, selectedDatasetBId, uploadingDataset, setCompareError, setUploadingDataset]);

  const datasetA = cleanDatasets.find((item) => item.id === selectedDatasetAId) ?? cleanDatasets[0];
  const datasetB = cleanDatasets.find((item) => item.id === selectedDatasetBId) ?? cleanDatasets[1] ?? cleanDatasets[0];

  useEffect(() => {
    if (datasetA) {
      setDatasetA(datasetA.data);
      setDatasetAName(datasetA.name);
    }

    if (datasetB) {
      setDatasetB(datasetB.data);
      setDatasetBName(datasetB.name);
    }
  }, [datasetA, datasetB, setDatasetA, setDatasetB, setDatasetAName, setDatasetBName]);

  const hasDatasets = cleanDatasets.length > 0;

  return (
    <section className="analysis-panel" style={{ display: 'grid', gap: '1.25rem' }}>
      <div className="step-heading">
        <span>02</span>
        <div>
          <h3 style={{ margin: 0 }}>Insights de Negocio & Comparación</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b' }}>
            Selecciona dos datasets limpios para detectar variaciones en volumen, facturación, calidad y comportamiento de datos.
          </p>
        </div>
      </div>

      {!hasDatasets ? (
        <div
          className="empty-state"
          style={{
            background: '#f8fafc',
            border: '1px solid #dbe4ef',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            color: '#334155',
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem' }}>No hay datasets limpios disponibles</h4>
          <p style={{ margin: '0 0 1rem', color: '#64748b' }}>
            Primero debes cargar y limpiar un CSV en el módulo de Carga y Limpieza.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/dashboard/limpiardatos')}>
            Ir a Carga y Limpieza
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                Dataset A (Base / Período Anterior)
              </label>
              <select
                className="form-input"
                value={selectedDatasetAId}
                onChange={(event) => setSelectedDatasetAId(event.target.value)}
                style={{ width: '100%' }}
              >
                {cleanDatasets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <small style={{ display: 'block', marginTop: '0.5rem', color: '#334155', fontWeight: 600 }}>
                Archivo activo: {datasetAName || 'Sin archivo'}
              </small>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                Dataset B (Nuevo / Período Actual)
              </label>
              <select
                className="form-input"
                value={selectedDatasetBId}
                onChange={(event) => setSelectedDatasetBId(event.target.value)}
                style={{ width: '100%' }}
              >
                {cleanDatasets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <small style={{ display: 'block', marginTop: '0.5rem', color: '#334155', fontWeight: 600 }}>
                Archivo activo: {datasetBName || 'Sin archivo'}
              </small>
            </div>
          </div>

          {uploadingDataset && (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <strong style={{ color: '#334155' }}>Cargando dataset {uploadingDataset}...</strong>
              {renderLoadingBar(uploadingDataset === 'A' ? '#2563eb' : '#10b981')}
            </div>
          )}

          {compareError && (
            <div className="alert-error" style={{ padding: '0.85rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b' }}>
              {compareError}
            </div>
          )}

          {isComparing && (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <strong style={{ color: '#334155' }}>Procesando y comparando datasets...</strong>
              {renderLoadingBar('#2563eb')}
            </div>
          )}

          {datasetA && datasetB && comparison && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div className="card" style={cardStyle}>
                  <h4 style={metricCardStyle}>Columnas compartidas</h4>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#2563eb' }}>{comparison.sharedColumns.length}</p>
                </div>
                <div className="card" style={cardStyle}>
                  <h4 style={metricCardStyle}>Diferencia de filas</h4>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '1.8rem', fontWeight: 700, color: comparison.rowDifference >= 0 ? '#10b981' : '#ef4444' }}>
                    {comparison.rowDifference > 0 ? '+' : ''}{comparison.rowDifference}
                  </p>
                </div>
                <div className="card" style={cardStyle}>
                  <h4 style={metricCardStyle}>% Filas difer.</h4>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b' }}>
                    {Math.abs(comparison.rowDifferencePct).toFixed(1)}%
                  </p>
                </div>
                <div className="card" style={cardStyle}>
                  <h4 style={metricCardStyle}>Calidad neta</h4>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '1.8rem', fontWeight: 700, color: comparison.qualityDelta >= 0 ? '#10b981' : '#ef4444' }}>
                    {comparison.qualityDelta >= 0 ? '+' : ''}{comparison.qualityDelta.toFixed(1)} pts
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <h4 style={{ margin: 0, color: '#1e293b' }}>Insights Automáticos & Métricas Clave</h4>
                {comparison.insights.map((insight, index) => {
                  const meta = getInsightMeta(insight);
                  const Icon = meta.icon;

                  const toneStyles = {
                    info: { background: '#f8fafc', border: '#cbd5e1', color: '#1e293b' },
                    success: { background: '#f0fdf4', border: '#86efac', color: '#166534' },
                    warning: { background: '#fff7ed', border: '#fdba74', color: '#9a5b00' },
                    danger: { background: '#fef2f2', border: '#fca5a5', color: '#991b1b' },
                  }[meta.tone];

                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.85rem 1rem',
                        borderRadius: '8px',
                        background: toneStyles.background,
                        border: `1px solid ${toneStyles.border}`,
                        color: toneStyles.color,
                        fontSize: '0.92rem',
                        lineHeight: '1.5',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '1.75rem', height: '1.75rem', borderRadius: '999px', background: 'rgba(255,255,255,0.7)' }}>
                        <Icon size={16} strokeWidth={2.2} />
                      </div>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: insight
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/`(.*?)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 2px 5px; border-radius: 4px; font-family: monospace;">$1</code>'),
                        }}
                        style={{ flex: 1 }}
                      />
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div style={cardStyle}>
                  <h4 style={{ marginTop: 0, fontSize: '0.95rem', color: '#1e293b' }}>Volumen de Filas</h4>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '180px', paddingTop: '1rem' }}>
                    {[
                      { label: 'Dataset A', value: comparison.rowsA },
                      { label: 'Dataset B', value: comparison.rowsB },
                    ].map((item) => {
                      const maxValue = Math.max(comparison.rowsA, comparison.rowsB, 1);
                      const height = `${(item.value / maxValue) * 100}%`;
                      return (
                        <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={barContainerStyle}>
                            <div style={{ width: '100%', height, borderRadius: '8px 8px 0 0', background: item.label === 'Dataset A' ? '#2563eb' : '#10b981', transition: 'height 0.3s ease' }} />
                          </div>
                          <strong style={{ fontSize: '0.85rem' }}>{item.label}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={cardStyle}>
                  <h4 style={{ marginTop: 0, fontSize: '0.95rem', color: '#1e293b' }}>Estructura de Columnas</h4>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '180px', paddingTop: '1rem' }}>
                    {[
                      { label: 'Dataset A', value: comparison.datasetA.headers.length },
                      { label: 'Dataset B', value: comparison.datasetB.headers.length },
                    ].map((item) => {
                      const maxValue = Math.max(comparison.datasetA.headers.length, comparison.datasetB.headers.length, 1);
                      const height = `${(item.value / maxValue) * 100}%`;
                      return (
                        <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={barContainerStyle}>
                            <div style={{ width: '100%', height, borderRadius: '8px 8px 0 0', background: item.label === 'Dataset A' ? '#8b5cf6' : '#f59e0b', transition: 'height 0.3s ease' }} />
                          </div>
                          <strong style={{ fontSize: '0.85rem' }}>{item.label}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
                  <h4 style={{ marginTop: 0, fontSize: '0.95rem', color: '#1e293b' }}>Comparativa de Valores Nulos por Columna (Dataset A vs B)</h4>
                  <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', padding: '1rem 0 0.5rem 0' }}>
                    {comparison.tableRows
                      .filter((r) => r.state === 'Compartida')
                      .map((row) => {
                        const nA = Number(row.nulosA) || 0;
                        const nB = Number(row.nulosB) || 0;
                        const maxN = Math.max(nA, nB, 1);
                        return (
                          <div key={row.column} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: '80px' }}>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '100px', background: '#f8fafc', padding: '0.25rem', borderRadius: '6px' }}>
                              <div title={`Nulos A: ${nA}`} style={{ width: '16px', height: `${(nA / maxN) * 100}%`, background: '#ef4444', borderRadius: '3px 3px 0 0' }} />
                              <div title={`Nulos B: ${nB}`} style={{ width: '16px', height: `${(nB / maxN) * 100}%`, background: '#f59e0b', borderRadius: '3px 3px 0 0' }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '80px' }}>
                              {row.column}
                            </span>
                            <small style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              A: {nA} | B: {nB}
                            </small>
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
                      <th style={thStyle}>Columna</th>
                      <th style={thStyle}>Estado</th>
                      <th style={thStyle}>Tipo (A - B)</th>
                      <th style={thStyle}>Promedio A</th>
                      <th style={thStyle}>Promedio B</th>
                      <th style={thStyle}>Nulos A</th>
                      <th style={thStyle}>Nulos B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.tableRows.map((row) => {
                      const isShared = row.state === 'Compartida';
                      const isNew = row.state === 'Nueva en B';

                      return (
                        <tr key={row.column}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{row.column}</td>
                          <td style={tdStyle}>
                            <span
                              style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: isShared ? '#e0f2fe' : isNew ? '#dcfce7' : '#fee2e2',
                                color: isShared ? '#0369a1' : isNew ? '#15803d' : '#b91c1c',
                              }}
                            >
                              {row.state}
                            </span>
                          </td>
                          <td style={tdStyle}>{row.typeA} - {row.typeB}</td>
                          <td style={tdStyle}>{row.mediaA}</td>
                          <td style={tdStyle}>{row.mediaB}</td>
                          <td style={{ ...tdStyle, color: Number(row.nulosA) > 0 ? '#dc2626' : 'inherit' }}>{row.nulosA}</td>
                          <td style={{ ...tdStyle, color: Number(row.nulosB) > 0 ? '#dc2626' : 'inherit' }}>{row.nulosB}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!comparison && !compareError && (
            <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem', background: '#fff', border: '1px solid #dbe4ef', borderRadius: '12px', color: '#64748b' }}>
              <p style={{ margin: 0 }}>Selecciona dos CSV limpios para analizar cambios en ventas, promedios, calidad y estructura.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}