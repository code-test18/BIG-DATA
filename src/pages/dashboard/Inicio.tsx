import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Rows3,
  TrendingUp,
} from 'lucide-react';
import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardContextType } from '../../types/csv';
import { calcularMetricasVentas } from '../../utils/calcularMetricasVentas';

const COLORS = ['#2563eb', '#0f766e', '#d97706', '#dc2626', '#0891b2', '#7c3aed'];

function findHeader(headers: string[], names: string[]) {
  return headers.find((header) => names.includes(header.trim().toLowerCase()));
}

function getSalesMapping(headers: string[]) {
  const fecha = findHeader(headers, ['date', 'fecha']);
  const categoria = findHeader(headers, ['product line', 'category', 'categoria', 'categoría']);
  const monto = findHeader(headers, ['sales', 'ventas', 'total', 'monto', 'amount']);
  const cantidad = findHeader(headers, ['quantity', 'cantidad', 'qty']);

  return fecha && categoria && monto ? { fecha, categoria, monto, cantidad } : null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function Inicio() {
  const { files } = useOutletContext<DashboardContextType>();
  const cleanFiles = files.filter((file) => file.isClean);
  const activeFile = cleanFiles.find((file) => getSalesMapping(file.headers)) ?? cleanFiles[0];

  const dashboardData = useMemo(() => {
    if (!activeFile) return null;

    const mapping = getSalesMapping(activeFile.headers);
    if (!mapping) return null;

    return calcularMetricasVentas(activeFile, mapping);
  }, [activeFile]);

  const metricas = dashboardData?.metricas;
  const qualityIssues = activeFile
    ? activeFile.rows.filter((row) => row.some((value) => value.trim() === '')).length
    : 0;
  const categoryData = dashboardData?.graficoPorCategoria ?? [];
  const participationData = dashboardData?.participacionCategoria ?? [];

  return (
    <div className="dashboard-page home-dashboard">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Resumen del espacio de trabajo</p>
          <h2>Inicio</h2>
          <p>Una vista rápida de tus datasets y resultados comerciales.</p>
        </div>
        <div className="dashboard-date">Actualizado hoy</div>
      </div>

      <div className="dashboard-kpis">
        <MetricCard icon={TrendingUp} label="Ingreso total" value={metricas ? formatCurrency(metricas.ingresoTotal) : '$0.00'} accent />
        <MetricCard icon={Rows3} label="Transacciones" value={(metricas?.numeroTransacciones ?? 0).toLocaleString('en-US')} />
        <MetricCard icon={BarChart3} label="Ticket promedio" value={metricas ? formatCurrency(metricas.ticketPromedio) : '$0.00'} />
        <MetricCard icon={Database} label="Datasets cargados" value={files.length.toString()} />
      </div>

      <div className="dashboard-main-grid">
        <section className="dashboard-card chart-card">
          <div className="card-heading">
            <div>
              <h3>Ingreso por categoría</h3>
              <p>Distribución del monto registrado en el dataset activo.</p>
            </div>
            <TrendingUp size={20} aria-hidden="true" />
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData} margin={{ top: 12, right: 8, left: -18, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(value: string) => value.split(' ')[0]} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="total" fill="#2563eb" radius={[5, 5, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : <ChartEmpty message={activeFile ? 'Mapea columnas de fecha, categoría y monto en Ventas.' : 'Carga y limpia un CSV para ver este gráfico.'} />}
        </section>

        <section className="dashboard-card dataset-card">
          <div className="card-heading">
            <div>
              <h3>Estado de datasets</h3>
              <p>Archivos disponibles para análisis.</p>
            </div>
            <FileSpreadsheet size={20} aria-hidden="true" />
          </div>
          {files.length > 0 ? files.map((file) => (
            <div className="dataset-row" key={file.id}>
              <div>
                <strong>{file.name}</strong>
                <span>{file.rows.length.toLocaleString('en-US')} filas · {file.isClean ? 'limpio' : 'pendiente'}</span>
              </div>
              {file.isClean ? <CheckCircle2 size={18} className="status-success" /> : <AlertCircle size={18} className="status-warning" />}
            </div>
          )) : <ChartEmpty message="Aún no hay archivos cargados." compact />}
          <div className="dataset-summary">
            <span>Calidad del archivo activo</span>
            <strong>{activeFile ? `${activeFile.rows.length - qualityIssues}/${activeFile.rows.length} filas completas` : 'Sin datos'}</strong>
          </div>
        </section>
      </div>

      <section className="dashboard-card participation-card">
        <div className="card-heading">
          <div>
            <h3>Participación por categoría</h3>
            <p>Las categorías con mayor peso dentro del ingreso total.</p>
          </div>
        </div>
        {participationData.length > 0 ? (
          <div className="participation-layout">
            <ResponsiveContainer width="42%" height={230}>
              <PieChart>
                <Pie data={participationData} dataKey="porcentaje" nameKey="categoria" innerRadius={62} outerRadius={92} paddingAngle={2}>
                  {participationData.map((item, index) => <Cell key={item.categoria} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => `${Number(value ?? 0).toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="participation-list">
              {participationData.map((item, index) => (
                <div className="participation-item" key={item.categoria}>
                  <span className="legend-dot" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span>{item.categoria}</span>
                  <strong>{item.porcentaje.toFixed(1)}%</strong>
                </div>
              ))}
            </div>
          </div>
        ) : <ChartEmpty message="Los datos aparecerán cuando exista un análisis comercial válido." />}
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, accent = false }: { icon: typeof TrendingUp; label: string; value: string; accent?: boolean }) {
  return <div className={`metric-card${accent ? ' metric-card-accent' : ''}`}><span><Icon size={16} />{label}</span><strong>{value}</strong></div>;
}

function ChartEmpty({ message, compact = false }: { message: string; compact?: boolean }) {
  return <div className={`chart-empty${compact ? ' chart-empty-compact' : ''}`}><BarChart3 size={compact ? 22 : 28} /><span>{message}</span></div>;
}

export default Inicio;