import type { DatasetComparison, ParsedDataset } from './ProcesarTypes';
import { parseCsvDataset } from './ProcesarUtils';

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
  return (
    <section className="analysis-panel" style={{ display: 'grid', gap: '1.25rem' }}>
      <div className="step-heading">
        <span>02</span>
        <div>
          <h3 style={{ margin: 0 }}>Insights de Negocio & Comparación</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b' }}>
            Carga tus archivos para detectar variaciones en volumen, facturación, calidad y comportamiento de datos.
          </p>
        </div>
      </div>

      {/* CONTROLES DE CARGA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* DATASET A */}
        <div className="form-group" style={{ margin: 0 }}>
          <span className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Dataset A (Base / Período Anterior)</span>
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

        {/* DATASET B */}
        <div className="form-group" style={{ margin: 0 }}>
          <span className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Dataset B (Nuevo / Período Actual)</span>
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

      {comparison && (
        <>
          {/* TARJETAS DE MÉTRICAS RÁPIDAS */}
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

          {/* INSIGHTS DINÁMICOS Y FINANCIEROS */}
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <h4 style={{ margin: 0, color: '#1e293b' }}>Insights Automáticos & Métricas Clave</h4>
            {comparison.insights.map((insight, index) => {
              const isAlert = insight.includes('') || insight.includes('') || insight.includes('');
              const isSuccess = insight.includes('') || insight.includes('') || insight.includes('') || insight.includes('');
              
              const bgColor = isAlert ? '#fef2f2' : isSuccess ? '#f0fdf4' : '#f8fafc';
              const borderColor = isAlert ? '#fca5a5' : isSuccess ? '#86efac' : '#cbd5e1';
              const textColor = isAlert ? '#991b1b' : isSuccess ? '#166534' : '#1e293b';

              return (
                <div
                  key={index}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    color: textColor,
                    fontSize: '0.92rem',
                    lineHeight: '1.5',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: insight
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/`(.*?)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 2px 5px; border-radius: 4px; font-family: monospace;">$1</code>'),
                  }}
                />
              );
            })}
          </div>

          {/* SECCIÓN DE GRÁFICOS COMPARATIVOS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Gráfico 1: Filas */}
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

            {/* Gráfico 2: Columnas */}
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

            {/* Gráfico 3: Nulos en Columnas Compartidas */}
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

          {/* TABLA DETALLADA POR COLUMNA */}
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
          <p style={{ margin: 0 }}>Sube ambos archivos CSV para analizar cambios en ventas, promedios, calidad y estructura.</p>
        </div>
      )}
    </section>
  );
}