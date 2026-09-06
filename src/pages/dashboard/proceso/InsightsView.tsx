import { useEffect, useMemo, useState, type CSSProperties, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useDatasets } from '../../../hooks/useDatasets';
import { inferColumnMapping, processDataset } from './ProcesarUtils';
import { buildLocalInsights, buildStructuralInsights } from '../../../utils/severityEngine';
import { InsightList } from '../../../components/InsightCard';
import { guardarReporte } from '../../../utils/reportesStorage';
import type {
  ColumnMapping, DatasetComparison, DatasetMetrics, ParsedDataset, TopProduct,
} from './ProcesarTypes';

interface InsightsViewProps {
  datasetAName: string;
  datasetBName: string;
  uploadingDataset: 'A' | 'B' | null;
  compareError: string | null;
  comparison: DatasetComparison | null;
  isComparing: boolean;
  setDatasetA: (dataset: ParsedDataset | null) => void;
  setDatasetB: (dataset: ParsedDataset | null) => void;
  setDatasetAName: (name: string) => void;
  setDatasetBName: (name: string) => void;
  setUploadingDataset: Dispatch<SetStateAction<'A' | 'B' | null>>;
  setCompareError: (error: string | null) => void;
}

/* ---------- Design tokens ---------- */
const COLOR_A = '#2563eb';
const COLOR_A_SOFT = '#eff6ff';
const COLOR_B = '#d946ef';
const COLOR_B_SOFT = '#fdf4ff';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6b7280';
const BORDER = '#e5e7eb';
const BG_PAGE = '#f7f7fb';
const PIE_PALETTE_A = ['#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#c7d2fe'];
const PIE_PALETTE_B = ['#d946ef', '#e879f9', '#f0abfc', '#f5d0fe', '#fae8ff', '#e9d5ff'];

const cardStyle: CSSProperties = {
  background: '#fff',
  border: `1px solid ${BORDER}`,
  borderRadius: '16px',
  padding: '1.5rem',
  boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
};

const money = (value: number) => `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

/* ---------- Subcomponentes de presentación ---------- */
type MetricComparisonBarProps = { label: string; valA: string; valB: string; pctA: number; pctB: number; nameA: string; nameB: string };
function MetricComparisonBar({ label, valA, valB, pctA, pctB, nameA, nameB }: MetricComparisonBarProps) {
  const rows = [
    { name: nameA, value: valA, pct: pctA, color: COLOR_A },
    { name: nameB, value: valB, pct: pctB, color: COLOR_B },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 150px', alignItems: 'center', gap: '1.25rem' }}>
      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: TEXT_PRIMARY }}>{label}</div>
      <div style={{ display: 'grid', gap: '0.55rem' }}>
        {rows.map((row) => (
          <div key={row.name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: TEXT_SECONDARY, width: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row.name}
            </span>
            <div style={{ flex: 1, background: '#f3f4f6', height: 10, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(row.pct, 100)}%`, background: row.color, height: '100%', borderRadius: 999, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: TEXT_PRIMARY }}>
        <div>{rows[0].value}</div>
        <div style={{ color: TEXT_SECONDARY, fontWeight: 600, marginTop: '0.35rem' }}>{rows[1].value}</div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div style={cardStyle}>
      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: TEXT_PRIMARY }}>{title}</h4>
      {subtitle ? <p style={{ margin: '0.2rem 0 1.1rem', fontSize: '0.78rem', color: TEXT_SECONDARY }}>{subtitle}</p> : <div style={{ marginBottom: '1.1rem' }} />}
      {children}
    </div>
  );
}

function ChartBody({ children, height = 220 }: { children: ReactNode; height?: number }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  );
}

function TopProductsTable({ title, color, products }: { title: string; color: string; products: TopProduct[] }) {
  return (
    <ChartCard title={title}>
      <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${BORDER}`, color: '#9ca3af', textAlign: 'left' }}>
            <th style={{ padding: '0 0 0.6rem', fontWeight: 600, fontSize: '0.7rem' }}>PRODUCTO</th>
            <th style={{ padding: '0 0 0.6rem', fontWeight: 600, fontSize: '0.7rem' }}>UNIDADES</th>
            <th style={{ padding: '0 0 0.6rem', textAlign: 'right', fontWeight: 600, fontSize: '0.7rem' }}>INGRESOS</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, i) => (
            <tr key={product.producto} style={{ borderBottom: i === products.length - 1 ? 'none' : '1px solid #f3f4f6' }}>
              <td style={{ padding: '0.65rem 0', fontWeight: 600, color }}>{product.producto}</td>
              <td style={{ color: TEXT_SECONDARY }}>{product.unidades.toLocaleString('es-PE')}</td>
              <td style={{ textAlign: 'right', fontWeight: 700, color: TEXT_PRIMARY }}>{money(product.ingresos)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ChartCard>
  );
}

function chartData(a: Record<string, number>, b: Record<string, number>, key: string) {
  return Array.from(new Set([...Object.keys(a), ...Object.keys(b)]))
    .sort()
    .map((label) => ({ [key]: label, datasetA: a[label] ?? 0, datasetB: b[label] ?? 0 }));
}

function pieData(categories: Record<string, number>, topN = 5) {
  const entries = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, topN);
  const restTotal = entries.slice(topN).reduce((sum, [, value]) => sum + value, 0);
  const data = top.map(([name, value]) => ({ name, value }));
  if (restTotal > 0) data.push({ name: 'Otros', value: restTotal });
  return data;
}

function DatasetSelector({
  label, color, softColor, badge, dataset, selectedId, onSelect, options,
}: {
  label: string; color: string; softColor: string; badge: string;
  dataset: ReturnType<typeof useDatasets>['cleanDatasets'][number] | undefined;
  selectedId: string; onSelect: (id: string) => void;
  options: ReturnType<typeof useDatasets>['cleanDatasets'];
}) {
  return (
    <div style={{ border: `1.5px solid ${color}33`, borderRadius: 14, padding: '1.1rem', background: softColor }}>
      <label style={{ fontSize: '0.7rem', fontWeight: 700, color, display: 'block', marginBottom: '0.5rem' }}>{label}</label>
      <select
        value={selectedId}
        onChange={(event) => onSelect(event.target.value)}
        style={{ width: '100%', padding: '0.6rem 0.7rem', borderRadius: 8, border: `1px solid ${BORDER}`, fontWeight: 600, fontSize: '0.875rem', background: '#fff', cursor: 'pointer' }}
      >
        {options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.68rem', padding: '3px 10px', borderRadius: 999, fontWeight: 700, background: color, color: '#fff' }}>{badge}</span>
        <span style={{ fontSize: '0.8rem', color: TEXT_SECONDARY }}>{dataset?.data.rows.length ?? 0} filas</span>
      </div>
    </div>
  );
}

/* ---------- Componente principal ---------- */
export default function InsightsView({
  datasetAName, datasetBName, comparison, isComparing, compareError,
  setDatasetA, setDatasetB, setDatasetAName, setDatasetBName,
}: InsightsViewProps) {
  const navigate = useNavigate();
  const { cleanDatasets } = useDatasets();

  const [selectedDatasetAId, setSelectedDatasetAId] = useState('');
  const [selectedDatasetBId, setSelectedDatasetBId] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const [mappingsById, setMappingsById] = useState<Record<string, ColumnMapping>>({});

  useEffect(() => {
    if (!cleanDatasets.length) return;
    if (!cleanDatasets.some((item) => item.id === selectedDatasetAId)) setSelectedDatasetAId(cleanDatasets[0].id);
    if (!cleanDatasets.some((item) => item.id === selectedDatasetBId)) setSelectedDatasetBId(cleanDatasets[1]?.id ?? cleanDatasets[0].id);
  }, [cleanDatasets, selectedDatasetAId, selectedDatasetBId]);

  const datasetA = cleanDatasets.find((item) => item.id === selectedDatasetAId) ?? cleanDatasets[0];
  const datasetB = cleanDatasets.find((item) => item.id === selectedDatasetBId) ?? cleanDatasets[1] ?? cleanDatasets[0];
  const visibleDatasetAName = datasetA?.name ?? '';
  const visibleDatasetBName = datasetB?.name ?? '';

  useEffect(() => {
    if (datasetA) { setDatasetA(datasetA.data); setDatasetAName(datasetA.name); }
    if (datasetB) { setDatasetB(datasetB.data); setDatasetBName(datasetB.name); }
  }, [datasetA?.id, datasetB?.id, setDatasetA, setDatasetB, setDatasetAName, setDatasetBName]);

  // Mapea automáticamente las columnas comunes de datasets de ventas.
  useEffect(() => {
    setMappingsById((previous) => {
      const next = { ...previous };
      if (datasetA && !next[datasetA.id]) next[datasetA.id] = inferColumnMapping(datasetA.data.headers);
      if (datasetB && !next[datasetB.id]) next[datasetB.id] = inferColumnMapping(datasetB.data.headers);
      return next;
    });
  }, [datasetA?.id, datasetB?.id]);

  const mappingA = datasetA ? mappingsById[datasetA.id] : undefined;
  const mappingB = datasetB ? mappingsById[datasetB.id] : undefined;
  const bothMapped = Boolean(mappingA && mappingB);

  const metricsA = useMemo(
    () => (datasetA && mappingA ? processDataset(datasetA.data.rows, datasetA.data.headers, mappingA) : null),
    [datasetA, mappingA]
  );
  const metricsB = useMemo(
    () => (datasetB && mappingB ? processDataset(datasetB.data.rows, datasetB.data.headers, mappingB) : null),
    [datasetB, mappingB]
  );

  const categoryChartData = useMemo(
    () => (metricsA && metricsB ? chartData(metricsA.categories, metricsB.categories, 'categoria') : []),
    [metricsA, metricsB]
  );
  const trendChartData = useMemo(
    () => (metricsA && metricsB ? chartData(metricsA.monthly, metricsB.monthly, 'mes') : []),
    [metricsA, metricsB]
  );
  const pieDataA = useMemo(() => (metricsA ? pieData(metricsA.categories) : []), [metricsA]);
  const pieDataB = useMemo(() => (metricsB ? pieData(metricsB.categories) : []), [metricsB]);

  const max = (key: keyof Pick<DatasetMetrics, 'totalIngresos' | 'totalUnidades' | 'ticketPromedio' | 'productosDistintos'>) =>
    Math.max(metricsA?.[key] ?? 0, metricsB?.[key] ?? 0, 1);

  const comparisonMetrics = useMemo(() => {
    if (!metricsA || !metricsB) return [];
    return [
      { label: 'Ingresos', a: money(metricsA.totalIngresos), b: money(metricsB.totalIngresos), aValue: metricsA.totalIngresos, bValue: metricsB.totalIngresos, key: 'totalIngresos' as const },
      { label: 'Unidades vendidas', a: metricsA.totalUnidades.toLocaleString('es-PE'), b: metricsB.totalUnidades.toLocaleString('es-PE'), aValue: metricsA.totalUnidades, bValue: metricsB.totalUnidades, key: 'totalUnidades' as const },
      { label: 'Ticket promedio', a: money(metricsA.ticketPromedio), b: money(metricsB.ticketPromedio), aValue: metricsA.ticketPromedio, bValue: metricsB.ticketPromedio, key: 'ticketPromedio' as const },
      { label: 'Productos distintos', a: String(metricsA.productosDistintos), b: String(metricsB.productosDistintos), aValue: metricsA.productosDistintos, bValue: metricsB.productosDistintos, key: 'productosDistintos' as const },
    ];
  }, [metricsA, metricsB]);

  const localInsights = useMemo(() => {
    if (!metricsA || !metricsB) return [];
    const structural = comparison ? buildStructuralInsights(comparison.qualityA, comparison.qualityB, comparison.rowDifferencePct) : [];
    return [...buildLocalInsights(metricsA, metricsB, datasetAName, datasetBName), ...structural];
  }, [metricsA, metricsB, datasetAName, datasetBName, comparison]);

  const hasDatasets = cleanDatasets.length > 0;

  const handleExportReport = () => {
    if (!datasetA || !datasetB || !metricsA || !metricsB) return;
    guardarReporte({
      id: crypto.randomUUID(),
      tipo: 'ventas',
      nombreArchivo: `${datasetA.name} vs ${datasetB.name}`,
      nombre: `Comparativa - ${datasetA.name} vs ${datasetB.name}`,
      fecha: new Date().toLocaleString(),
      createdAt: new Date().toISOString(),
      resumen: `Comparativa entre ${datasetA.name} y ${datasetB.name}. Incluye métricas, evolución mensual, categorías, participación y productos principales.`,
      metricas: comparisonMetrics.map(({ label, a }) => ({ label: `${label} - ${datasetA.name}`, value: a }))
        .concat(comparisonMetrics.map(({ label, b }) => ({ label: `${label} - ${datasetB.name}`, value: b }))),
      graficoComparativoCategoria: categoryChartData.map((item) => ({ label: String(item.categoria), datasetA: item.datasetA, datasetB: item.datasetB })),
      graficoComparativoMes: trendChartData.map((item) => ({ label: String(item.mes), datasetA: item.datasetA, datasetB: item.datasetB })),
      participacionCategoriaA: pieDataA.map((item) => ({ categoria: item.name, porcentaje: Number(((item.value / Math.max(metricsA.totalIngresos, 1)) * 100).toFixed(2)) })),
      participacionCategoriaB: pieDataB.map((item) => ({ categoria: item.name, porcentaje: Number(((item.value / Math.max(metricsB.totalIngresos, 1)) * 100).toFixed(2)) })),
      productosDatasetA: metricsA.topProducts,
      productosDatasetB: metricsB.topProducts,
      nombresDatasets: { a: datasetA.name, b: datasetB.name },
      insightsComparativos: comparison?.insights ?? [],
    });
    setToast('¡Reporte exportado con éxito!');
    window.setTimeout(() => setToast(null), 3000);
  };

  return (
    <section style={{ display: 'grid', gap: '1.75rem', background: BG_PAGE, padding: '1.75rem', borderRadius: 20 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: TEXT_PRIMARY }}>Comparar supermercado</h2>
          {hasDatasets && bothMapped && (
            <button type="button" onClick={handleExportReport} style={{ background: COLOR_A, color: '#fff', border: 0, borderRadius: 10, padding: '0.65rem 1rem', fontWeight: 700, cursor: 'pointer' }}>
              Exportar reporte
            </button>
          )}
        </div>
        <p style={{ margin: '0.35rem 0 0', color: TEXT_SECONDARY, fontSize: '0.9rem' }}>
          Elige dos archivos para graficarlos y ver qué explica la diferencia.
        </p>
      </div>

      {toast && (
        <div role="status" style={{ position: 'fixed', right: '1.5rem', bottom: '1.5rem', zIndex: 10, background: '#166534', color: '#fff', padding: '0.85rem 1.1rem', borderRadius: 10, fontWeight: 700 }}>
          {toast}
        </div>
      )}

      {compareError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '0.9rem 1.1rem', color: '#b91c1c', fontSize: '0.85rem' }}>
          {compareError}
        </div>
      )}

      {!hasDatasets ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3.5rem 2rem' }}>
          <p style={{ color: TEXT_SECONDARY, marginBottom: '1.25rem', fontSize: '0.95rem' }}>No hay datasets cargados.</p>
          <button type="button" onClick={() => navigate('/dashboard/limpiardatos')} style={{ padding: '0.65rem 1.4rem', borderRadius: 10, border: 'none', background: COLOR_A, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            Ir a Carga y Limpieza
          </button>
        </div>
      ) : (
        <>
          <div style={cardStyle}>
            <span style={{ fontSize: '0.8rem', color: TEXT_SECONDARY, fontWeight: 600, display: 'block', marginBottom: '1rem' }}>
              Archivos disponibles · seleccionados 2 de {cleanDatasets.length}
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.1rem' }}>
              <DatasetSelector label="NUESTRO DATASET" color={COLOR_A} softColor={COLOR_A_SOFT} badge="Nuestra" dataset={datasetA} selectedId={selectedDatasetAId} onSelect={setSelectedDatasetAId} options={cleanDatasets} />
              <DatasetSelector label="COMPETENCIA" color={COLOR_B} softColor={COLOR_B_SOFT} badge="Competencia" dataset={datasetB} selectedId={selectedDatasetBId} onSelect={setSelectedDatasetBId} options={cleanDatasets} />
            </div>
          </div>

          {!bothMapped && (
            <div style={{ ...cardStyle, textAlign: 'center', color: TEXT_SECONDARY, fontSize: '0.85rem' }}>
              Confirma el mapeo de columnas de ambos datasets para ver el análisis.
            </div>
          )}

          {bothMapped && metricsA && metricsB && (
            <>
              <div style={cardStyle}>
                <h4 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 700, color: TEXT_PRIMARY }}>Métricas clave</h4>
                <div style={{ display: 'grid', gap: '1.4rem' }}>
                  {comparisonMetrics.map((metric) => (
                    <MetricComparisonBar
                      key={metric.label}
                      label={metric.label}
                      valA={metric.a}
                      valB={metric.b}
                      pctA={(metric.aValue / max(metric.key)) * 100}
                      pctB={(metric.bValue / max(metric.key)) * 100}
                      nameA={visibleDatasetAName}
                      nameB={visibleDatasetBName}
                    />
                  ))}
                </div>
              </div>

              <ChartCard title="Evolución de ingresos">
                <ChartBody>
                  <LineChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12, fill: TEXT_SECONDARY }} axisLine={{ stroke: BORDER }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: TEXT_SECONDARY }} axisLine={false} tickLine={false} tickFormatter={(value) => money(Number(value))} />
                    <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 10, border: `1px solid ${BORDER}` }} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                    <Line name={visibleDatasetAName} type="monotone" dataKey="datasetA" stroke={COLOR_A} strokeWidth={2.5} dot={{ r: 4, fill: COLOR_A }} activeDot={{ r: 6 }} />
                    <Line name={visibleDatasetBName} type="monotone" dataKey="datasetB" stroke={COLOR_B} strokeWidth={2.5} dot={{ r: 4, fill: COLOR_B }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ChartBody>
              </ChartCard>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.1rem' }}>
                <ChartCard title="Ingresos por categoría">
                  <ChartBody height={200}>
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="categoria" tick={{ fontSize: 12, fill: TEXT_SECONDARY }} axisLine={{ stroke: BORDER }} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: TEXT_SECONDARY }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 10, border: `1px solid ${BORDER}` }} />
                      <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                      <Bar name={visibleDatasetAName} dataKey="datasetA" fill={COLOR_A} radius={[6, 6, 0, 0]} />
                      <Bar name={visibleDatasetBName} dataKey="datasetB" fill={COLOR_B} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartBody>
                </ChartCard>

                <ChartCard title="Participación por categoría" subtitle="Top 5 categorías de cada dataset">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', height: 210 }}>
                    <div>
                      <p style={{ margin: '0 0 0.35rem', fontSize: '0.75rem', fontWeight: 700, color: COLOR_A, textAlign: 'center' }}>{visibleDatasetAName}</p>
                      <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                          <Pie data={pieDataA} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="80%" paddingAngle={2}>
                            {pieDataA.map((entry, i) => <Cell key={entry.name} fill={PIE_PALETTE_A[i % PIE_PALETTE_A.length]} />)}
                          </Pie>
                          <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: '0.75rem' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.35rem', fontSize: '0.75rem', fontWeight: 700, color: COLOR_B, textAlign: 'center' }}>{visibleDatasetBName}</p>
                      <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                          <Pie data={pieDataB} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="80%" paddingAngle={2}>
                            {pieDataB.map((entry, i) => <Cell key={entry.name} fill={PIE_PALETTE_B[i % PIE_PALETTE_B.length]} />)}
                          </Pie>
                          <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: '0.75rem' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </ChartCard>
              </div>

              {isComparing && (
                <div style={{ ...cardStyle, textAlign: 'center', color: TEXT_SECONDARY, fontSize: '0.85rem' }}>
                  Calculando comparación estructural…
                </div>
              )}

              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.35rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: TEXT_PRIMARY }}>Alertas y hallazgos</h3>
                </div>
                <InsightList insights={localInsights} emptyMessage="No se encontraron diferencias relevantes entre ambos datasets." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.4rem' }}>
                <TopProductsTable title={`${datasetAName} — productos con más ingreso`} color={COLOR_A} products={metricsA.topProducts} />
                <TopProductsTable title={`${datasetBName} — productos con más ingreso`} color={COLOR_B} products={metricsB.topProducts} />
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}