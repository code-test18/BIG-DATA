import { useEffect, useMemo, useState, type CSSProperties, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDatasets } from '../../../hooks/useDatasets';
import { processDataset } from './ProcesarUtils';
import type { DatasetComparison, DatasetMetrics, ParsedDataset, TopProduct } from './ProcesarTypes';
import { guardarReporte } from '../../../utils/reportesStorage';

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
  transition: 'box-shadow 0.2s ease',
};

const money = (value: number) => `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
const pct = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

/** Convierte **negritas** estilo markdown (como las que genera buildComparison) en <strong>. */
function renderMarkdown(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    return <span key={i}>{part}</span>;
  });
}

/** Separa un insight tipo "**Categoría:** resto del texto" en { label, rest }. */
function splitInsight(text: string): { label: string; rest: string } {
  const match = text.match(/^\*\*([^*]+)\*\*:?\s*/);
  if (match) return { label: match[1], rest: text.slice(match[0].length) };
  return { label: 'Insight', rest: text };
}

/* ---------- Metric comparison row ---------- */
type MetricComparisonBarProps = { label: string; valA: string; valB: string; pctA: number; pctB: number; nameA: string; nameB: string };
export function MetricComparisonBar({ label, valA, valB, pctA, pctB, nameA, nameB }: MetricComparisonBarProps) {
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
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: row.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: TEXT_SECONDARY, width: '90px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row.name}
            </span>
            <div style={{ flex: 1, background: '#f3f4f6', height: '10px', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(row.pct, 100)}%`,
                  background: row.color,
                  height: '100%',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease',
                }}
              />
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

export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div style={cardStyle}>
      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: TEXT_PRIMARY, letterSpacing: '-0.01em' }}>{title}</h4>
      {subtitle ? <p style={{ margin: '0.2rem 0 1.1rem', fontSize: '0.78rem', color: TEXT_SECONDARY }}>{subtitle}</p> : <div style={{ marginBottom: '1.1rem' }} />}
      {children}
    </div>
  );
}

export function TopProductsTable({ title, color, products }: { title: string; color: string; products: TopProduct[] }) {
  return (
    <ChartCard title={title}>
      <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${BORDER}`, color: '#9ca3af', textAlign: 'left' }}>
            <th style={{ padding: '0 0 0.6rem', fontWeight: 600, letterSpacing: '0.03em', fontSize: '0.7rem' }}>PRODUCTO</th>
            <th style={{ padding: '0 0 0.6rem', fontWeight: 600, letterSpacing: '0.03em', fontSize: '0.7rem' }}>UNIDADES</th>
            <th style={{ padding: '0 0 0.6rem', textAlign: 'right', fontWeight: 600, letterSpacing: '0.03em', fontSize: '0.7rem' }}>INGRESOS</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, i) => (
            <tr
              key={product.producto}
              style={{
                borderBottom: i === products.length - 1 ? 'none' : `1px solid #f3f4f6`,
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
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

/** Tabla del motor de comparación: cada insight se descompone en Categoría + Detalle. */
function EngineInsightsTable({ insights }: { insights: string[] }) {
  const rows = insights.map((text) => splitInsight(text));
  return (
    <ChartCard title="Motor de comparación" subtitle="Hallazgos calculados automáticamente al comparar ambos datasets">
      <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${BORDER}`, color: '#9ca3af', textAlign: 'left' }}>
            <th style={{ padding: '0 1rem 0.6rem 0', fontWeight: 600, letterSpacing: '0.03em', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
              CATEGORÍA
            </th>
            <th style={{ padding: '0 0 0.6rem', fontWeight: 600, letterSpacing: '0.03em', fontSize: '0.7rem' }}>DETALLE</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i === rows.length - 1 ? 'none' : `1px solid #f3f4f6` }}>
              <td
                style={{
                  padding: '0.75rem 1rem 0.75rem 0',
                  fontWeight: 700,
                  color: TEXT_PRIMARY,
                  whiteSpace: 'nowrap',
                  verticalAlign: 'top',
                }}
              >
                {row.label}
              </td>
              <td style={{ padding: '0.75rem 0', color: '#374151', lineHeight: 1.5 }}>{renderMarkdown(row.rest)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ChartCard>
  );
}

const metricRows = (a: DatasetMetrics, b: DatasetMetrics) => [
  { label: 'Ingresos', a: money(a.totalIngresos), b: money(b.totalIngresos), aValue: a.totalIngresos, bValue: b.totalIngresos },
  { label: 'Unidades vendidas', a: a.totalUnidades.toLocaleString('es-PE'), b: b.totalUnidades.toLocaleString('es-PE'), aValue: a.totalUnidades, bValue: b.totalUnidades },
  { label: 'Ticket promedio', a: money(a.ticketPromedio), b: money(b.ticketPromedio), aValue: a.ticketPromedio, bValue: b.ticketPromedio },
  { label: 'Productos distintos', a: String(a.productosDistintos), b: String(b.productosDistintos), aValue: a.productosDistintos, bValue: b.productosDistintos },
];
const chartData = (a: Record<string, number>, b: Record<string, number>, key: string) =>
  Array.from(new Set([...Object.keys(a), ...Object.keys(b)]))
    .sort()
    .map((label) => ({ [key]: label, datasetA: a[label] ?? 0, datasetB: b[label] ?? 0 }));

/** Top N categorías de un dataset como data de pie chart, agrupando el resto en "Otros". */
function pieData(categories: Record<string, number>, topN = 5) {
  const entries = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, topN);
  const restTotal = entries.slice(topN).reduce((sum, [, value]) => sum + value, 0);
  const data = top.map(([name, value]) => ({ name, value }));
  if (restTotal > 0) data.push({ name: 'Otros', value: restTotal });
  return data;
}

/** Entrada con mayor valor de un record { categoria: valor }. */
function topEntry(record: Record<string, number>): [string, number] | null {
  const entries = Object.entries(record);
  if (!entries.length) return null;
  return entries.reduce((max, entry) => (entry[1] > max[1] ? entry : max));
}

/* ---------- Selector card (dataset picker) ---------- */
function DatasetSelector({
  label,
  color,
  softColor,
  badge,
  dataset,
  selectedId,
  onSelect,
  options,
}: {
  label: string;
  color: string;
  softColor: string;
  badge: string;
  dataset: ReturnType<typeof useDatasets>['cleanDatasets'][number] | undefined;
  selectedId: string;
  onSelect: (id: string) => void;
  options: ReturnType<typeof useDatasets>['cleanDatasets'];
}) {
  return (
    <div
      style={{
        border: `1.5px solid ${color}33`,
        borderRadius: '14px',
        padding: '1.1rem',
        background: softColor,
      }}
    >
      <label style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', color, display: 'block', marginBottom: '0.5rem' }}>
        {label}
      </label>
      <select
        value={selectedId}
        onChange={(event) => onSelect(event.target.value)}
        style={{
          width: '100%',
          padding: '0.6rem 0.7rem',
          borderRadius: '8px',
          border: `1px solid ${BORDER}`,
          fontWeight: 600,
          fontSize: '0.875rem',
          color: TEXT_PRIMARY,
          background: '#fff',
          cursor: 'pointer',
        }}
      >
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            fontSize: '0.68rem',
            padding: '3px 10px',
            borderRadius: '999px',
            fontWeight: 700,
            background: color,
            color: '#fff',
            letterSpacing: '0.02em',
          }}
        >
          {badge}
        </span>
        <span style={{ fontSize: '0.8rem', color: TEXT_SECONDARY }}>{dataset?.data.rows.length ?? 0} filas</span>
      </div>
    </div>
  );
}

export default function InsightsView({
  datasetAName,
  datasetBName,
  comparison,
  isComparing,
  compareError,
  setDatasetA,
  setDatasetB,
  setDatasetAName,
  setDatasetBName,
}: InsightsViewProps) {
  const navigate = useNavigate();
  const { cleanDatasets } = useDatasets();
  const [selectedDatasetAId, setSelectedDatasetAId] = useState('');
  const [selectedDatasetBId, setSelectedDatasetBId] = useState('');
  const [toast, setToast] = useState<string | null>(null);

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
    if (datasetA) {
      setDatasetA(datasetA.data);
      setDatasetAName(datasetA.name);
    }
    if (datasetB) {
      setDatasetB(datasetB.data);
      setDatasetBName(datasetB.name);
    }
  }, [datasetA, datasetB, setDatasetA, setDatasetB, setDatasetAName, setDatasetBName]);

  const metricsA = useMemo(() => processDataset(datasetA?.data.rows ?? [], datasetA?.data.headers ?? []), [datasetA]);
  const metricsB = useMemo(() => processDataset(datasetB?.data.rows ?? [], datasetB?.data.headers ?? []), [datasetB]);
  const categoryChartData = useMemo(() => chartData(metricsA.categories, metricsB.categories, 'categoria'), [metricsA.categories, metricsB.categories]);
  const trendChartData = useMemo(() => chartData(metricsA.monthly, metricsB.monthly, 'mes'), [metricsA.monthly, metricsB.monthly]);
  const pieDataA = useMemo(() => pieData(metricsA.categories), [metricsA.categories]);
  const pieDataB = useMemo(() => pieData(metricsB.categories), [metricsB.categories]);
  const max = (key: keyof Pick<DatasetMetrics, 'totalIngresos' | 'totalUnidades' | 'ticketPromedio' | 'productosDistintos'>) =>
    Math.max(metricsA[key], metricsB[key], 1);
  const hasDatasets = cleanDatasets.length > 0;
  const comparisonMetrics = metricRows(metricsA, metricsB);

  const handleExportReport = () => {
    if (!datasetA || !datasetB) return;

    guardarReporte({
      id: crypto.randomUUID(),
      tipo: 'ventas',
      nombreArchivo: `${datasetA.name} vs ${datasetB.name}`,
      nombre: `Comparativa - ${datasetA.name} vs ${datasetB.name}`,
      fecha: new Date().toLocaleString(),
      createdAt: new Date().toISOString(),
      resumen: `Comparativa entre ${datasetA.name} y ${datasetB.name}. Incluye métricas, evolución mensual, categorías, participación y productos principales.`,
      metricas: comparisonMetrics.map(({ label, a }) => ({ label: `${label} - ${datasetA.name}`, value: a })).concat(
        comparisonMetrics.map(({ label, b }) => ({ label: `${label} - ${datasetB.name}`, value: b })),
      ),
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

  /* ---------- Insights calculados localmente a partir de las métricas ---------- */
  const localInsights = useMemo(() => {
    const list: { title: string; color: string; background: string; body: ReactNode }[] = [];

    if (metricsB.hasDescuentos && !metricsA.hasDescuentos) {
      list.push({
        title: `Promociones y descuentos: lo tiene ${datasetBName}, nosotros no`,
        color: '#16a34a',
        background: '#f0fdf4',
        body: (
          <>
            {datasetBName} registra <code>descuento_aplicado</code> con un volumen total de <strong>{money(metricsB.totalDescuentos)}</strong>.
          </>
        ),
      });
    }
    if (metricsB.hasCanalVenta && !metricsA.hasCanalVenta) {
      list.push({
        title: 'Diversificación de canales de venta',
        color: COLOR_B,
        background: COLOR_B_SOFT,
        body: (
          <>
            {datasetBName} mide sus ingresos mediante <code>canal_venta</code>; {datasetAName} no cuenta con esta variable.
          </>
        ),
      });
    }

    const leaderA = topEntry(metricsA.categories);
    const leaderB = topEntry(metricsB.categories);
    if (leaderA && leaderB && leaderA[0] !== leaderB[0]) {
      list.push({
        title: 'Categorías líder distintas',
        color: '#d97706',
        background: '#fffbeb',
        body: (
          <>
            En {datasetAName} la categoría con más ingresos es <strong>{leaderA[0]}</strong> ({money(leaderA[1])}), mientras que en {datasetBName} es{' '}
            <strong>{leaderB[0]}</strong> ({money(leaderB[1])}).
          </>
        ),
      });
    }

    if (metricsA.ticketPromedio > 0 && metricsB.ticketPromedio > 0) {
      const diff = ((metricsA.ticketPromedio - metricsB.ticketPromedio) / metricsB.ticketPromedio) * 100;
      if (Math.abs(diff) >= 3) {
        const quien = diff > 0 ? datasetAName : datasetBName;
        list.push({
          title: `${quien} tiene el ticket promedio más alto`,
          color: COLOR_A,
          background: COLOR_A_SOFT,
          body: (
            <>
              El ticket promedio de {datasetAName} ({money(metricsA.ticketPromedio)}) es {pct(diff)} respecto al de {datasetBName} (
              {money(metricsB.ticketPromedio)}).
            </>
          ),
        });
      }
    }

    const monthsA = Object.entries(metricsA.monthly).sort(([m1], [m2]) => m1.localeCompare(m2));
    const monthsB = Object.entries(metricsB.monthly).sort(([m1], [m2]) => m1.localeCompare(m2));
    if (monthsA.length >= 2 && monthsB.length >= 2) {
      const growth = (months: [string, number][]) => {
        const first = months[0][1];
        const last = months[months.length - 1][1];
        return first > 0 ? ((last - first) / first) * 100 : 0;
      };
      const growthA = growth(monthsA);
      const growthB = growth(monthsB);
      list.push({
        title: 'Tendencia del período',
        color: '#0891b2',
        background: '#ecfeff',
        body: (
          <>
            {datasetAName} {growthA >= 0 ? 'creció' : 'cayó'} {pct(growthA)} entre el primer y último mes registrado; {datasetBName}{' '}
            {growthB >= 0 ? 'creció' : 'cayó'} {pct(growthB)} en el mismo periodo.
          </>
        ),
      });
    }

    if (metricsA.productosDistintos !== metricsB.productosDistintos) {
      const masVariedad = metricsA.productosDistintos > metricsB.productosDistintos ? datasetAName : datasetBName;
      const diffProductos = Math.abs(metricsA.productosDistintos - metricsB.productosDistintos);
      list.push({
        title: `${masVariedad} tiene más variedad de catálogo`,
        color: '#7c3aed',
        background: '#f5f3ff',
        body: (
          <>
            {masVariedad} vende {diffProductos} producto{diffProductos === 1 ? '' : 's'} distinto{diffProductos === 1 ? '' : 's'} más que su comparado.
          </>
        ),
      });
    }

    return list;
  }, [metricsA, metricsB, datasetAName, datasetBName]);

  return (
    <section
      className="analysis-panel"
      style={{ display: 'grid', gap: '1.75rem', background: BG_PAGE, padding: '1.75rem', borderRadius: '20px' }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: TEXT_PRIMARY, letterSpacing: '-0.02em' }}>Comparar supermercado</h2>
          {hasDatasets && <button type="button" className="btn btn-primary" onClick={handleExportReport} style={{ background: COLOR_A, color: '#fff', border: 0, borderRadius: '10px', padding: '0.65rem 1rem', fontWeight: 700, cursor: 'pointer' }}>Exportar reporte</button>}
        </div>
        <p style={{ margin: '0.35rem 0 0', color: TEXT_SECONDARY, fontSize: '0.9rem' }}>
          Elige uno o dos archivos para graficarlos y ver qué explica la diferencia.
        </p>
      </div>

      {toast && <div role="status" style={{ position: 'fixed', right: '1.5rem', bottom: '1.5rem', zIndex: 10, background: '#166534', color: '#fff', padding: '0.85rem 1.1rem', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)', fontSize: '0.875rem', fontWeight: 700 }}>{toast}</div>}

      {compareError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '0.9rem 1.1rem', color: '#b91c1c', fontSize: '0.85rem' }}>
          {compareError}
        </div>
      )}

      {!hasDatasets ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3.5rem 2rem' }}>
          <p style={{ color: TEXT_SECONDARY, marginBottom: '1.25rem', fontSize: '0.95rem' }}>No hay datasets cargados.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/dashboard/limpiardatos')}
            style={{
              padding: '0.65rem 1.4rem',
              borderRadius: '10px',
              border: 'none',
              background: COLOR_A,
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Ir a Carga y Limpieza
          </button>
        </div>
      ) : (
        <>
          <div style={cardStyle}>
            <span style={{ fontSize: '0.8rem', color: TEXT_SECONDARY, fontWeight: 600, display: 'block', marginBottom: '1rem' }}>
              Archivos disponibles &middot; seleccionados 2 de {cleanDatasets.length}
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.1rem' }}>
              <DatasetSelector
                label="NUESTRO DATASET"
                color={COLOR_A}
                softColor={COLOR_A_SOFT}
                badge="Nuestra"
                dataset={datasetA}
                selectedId={selectedDatasetAId}
                onSelect={setSelectedDatasetAId}
                options={cleanDatasets}
              />
              <DatasetSelector
                label="COMPETENCIA"
                color={COLOR_B}
                softColor={COLOR_B_SOFT}
                badge="Competencia"
                dataset={datasetB}
                selectedId={selectedDatasetBId}
                onSelect={setSelectedDatasetBId}
                options={cleanDatasets}
              />
            </div>
          </div>

          <div style={cardStyle}>
            <h4 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 700, color: TEXT_PRIMARY }}>Métricas clave</h4>
            <div style={{ display: 'grid', gap: '1.4rem' }}>
              {comparisonMetrics.map((metric) => {
                const key =
                  metric.label === 'Ingresos'
                    ? 'totalIngresos'
                    : metric.label === 'Unidades vendidas'
                    ? 'totalUnidades'
                    : metric.label === 'Ticket promedio'
                    ? 'ticketPromedio'
                    : 'productosDistintos';
                return (
                  <MetricComparisonBar
                    key={metric.label}
                    label={metric.label}
                    valA={metric.a}
                    valB={metric.b}
                    pctA={(metric.aValue / max(key)) * 100}
                    pctB={(metric.bValue / max(key)) * 100}
                    nameA={visibleDatasetAName}
                    nameB={visibleDatasetBName}
                  />
                );
              })}
            </div>
          </div>

          {/* Tendencia (área) */}
          <ChartCard title="Evolución de ingresos">
            <ChartBody>
              <AreaChart data={trendChartData}>
                <defs>
                  <linearGradient id="fillA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLOR_A} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={COLOR_A} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fillB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLOR_B} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={COLOR_B} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: TEXT_SECONDARY }} axisLine={{ stroke: BORDER }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: TEXT_SECONDARY }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 10, border: `1px solid ${BORDER}` }} />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                <Area name={visibleDatasetAName} type="monotone" dataKey="datasetA" stroke={COLOR_A} strokeWidth={2.5} fill="url(#fillA)" />
                <Area name={visibleDatasetBName} type="monotone" dataKey="datasetB" stroke={COLOR_B} strokeWidth={2.5} fill="url(#fillB)" />
              </AreaChart>
            </ChartBody>
          </ChartCard>

          {/* Categoría (barras) + participación por categoría (donuts) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.4rem' }}>
            <ChartCard title="Ingresos por categoría">
              <ChartBody>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', height: 240 }}>
                <div>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.75rem', fontWeight: 700, color: COLOR_A, textAlign: 'center' }}>{visibleDatasetAName}</p>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie data={pieDataA} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="80%" paddingAngle={2}>
                        {pieDataA.map((entry, i) => (
                          <Cell key={entry.name} fill={PIE_PALETTE_A[i % PIE_PALETTE_A.length]} />
                        ))}
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
                        {pieDataB.map((entry, i) => (
                          <Cell key={entry.name} fill={PIE_PALETTE_B[i % PIE_PALETTE_B.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: '0.75rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </ChartCard>
          </div>

          {isComparing && (
            <div style={{ ...cardStyle, textAlign: 'center', color: TEXT_SECONDARY, fontSize: '0.85rem' }}>Calculando comparación estructural…</div>
          )}

          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 1.35rem', fontSize: '1.05rem', fontWeight: 700, color: TEXT_PRIMARY }}>Por qué vende más</h3>
            {localInsights.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.85rem', color: TEXT_SECONDARY }}>No se encontraron diferencias relevantes entre ambos datasets.</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {localInsights.map((insight) => (
                  <Insight key={insight.title} title={insight.title} color={insight.color} background={insight.background}>
                    {insight.body}
                  </Insight>
                ))}
              </div>
            )}
          </div>

          {comparison && comparison.insights.length > 0 && <EngineInsightsTable insights={comparison.insights} />}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.4rem' }}>
            <TopProductsTable title={`${datasetAName} — productos con más ingreso`} color={COLOR_A} products={metricsA.topProducts} />
            <TopProductsTable title={`${datasetBName} — productos con más ingreso`} color={COLOR_B} products={metricsB.topProducts} />
          </div>
        </>
      )}
    </section>
  );
}

function ChartBody({ children }: { children: ReactNode }) {
  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function Insight({ title, color, background, children }: { title: string; color: string; background: string; children: ReactNode }) {
  return (
    <div style={{ borderLeft: `4px solid ${color}`, background, padding: '1rem 1.2rem', borderRadius: '0 10px 10px 0' }}>
      <h5 style={{ margin: '0 0 0.4rem', color, fontSize: '0.9rem', fontWeight: 700 }}>{title}</h5>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#374151', lineHeight: '1.5' }}>{children}</p>
    </div>
  );
}