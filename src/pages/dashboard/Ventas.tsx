import {
  Award,
  BarChart3,
  Check,
  DollarSign,
  Package,
  PieChart as PieIcon,
  Receipt,
  Save,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardContextType } from '../../types/csv';
import type { PuntoParticipacion, VentasSelection, VentaReporte } from '../../types/ventas';
import { calcularMetricasVentas, type ResultadoCalculoVentas } from '../../utils/calcularMetricasVentas';
import { guardarReporte } from '../../utils/reportesStorage';

const COLORES_PASTEL = [
  '#6366f1',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#3b82f6',
  '#14b8a6',
  '#f43f5e',
  '#84cc16',
];

function Ventas() {
  const { files, activeFileId, setActiveFileId } = useOutletContext<DashboardContextType>();
  const [selection, setSelection] = useState<VentasSelection>({});
  const [guardado, setGuardado] = useState(false);

  const cleanFiles = files.filter((file) => file.isClean);
  const activeFile = cleanFiles.find((file) => file.id === activeFileId) ?? cleanFiles[0];

  const handleFileChange = (fileId: string) => {
    setActiveFileId(fileId);
    setSelection({});
    setGuardado(false);
  };

  const handleColumnChange = (role: keyof VentasSelection, value: string) => {
    setSelection((current) => ({ ...current, [role]: value }));
    setGuardado(false);
  };

  const mapeoCompleto =
    selection.fecha && selection.categoria && selection.monto
      ? {
          fecha: selection.fecha,
          categoria: selection.categoria,
          monto: selection.monto,
          cantidad: selection.cantidad,
        }
      : null;

  const resultado =
    activeFile && mapeoCompleto ? calcularMetricasVentas(activeFile, mapeoCompleto) : null;

  const handleGuardarReporte = () => {
    if (!activeFile || !resultado || !mapeoCompleto) return;

    const reporte: VentaReporte = {
      id: crypto.randomUUID(),
      tipo: 'ventas',
      nombreArchivo: activeFile.name,
      nombre: `Ventas - ${activeFile.name}`,
      fecha: new Date().toLocaleString(),
      resumen: `Análisis comercial para ${activeFile.name} usando ${mapeoCompleto.categoria} como categoría y ${mapeoCompleto.monto} como monto.`,
      createdAt: new Date().toISOString(),
      mapeo: mapeoCompleto,
      metricas: resultado.metricas,
      graficoPorCategoria: resultado.graficoPorCategoria,
      graficoPorFecha: resultado.graficoPorFecha,
      graficoUnidadesPorCategoria: resultado.graficoUnidadesPorCategoria,
      participacionCategoria: resultado.participacionCategoria,
    };

    guardarReporte(reporte);
    setGuardado(true);
  };

  return (
    <div className="dashboard-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Módulo de Ventas</h2>
          <p>Selecciona un CSV limpio y mapea las columnas para generar análisis comerciales y gráficos interactivos.</p>
        </div>
      </div>

      {cleanFiles.length === 0 ? (
        <div className="empty-state">
          <p>No hay CSV limpios disponibles. Primero carga y limpia un archivo en Carga y Limpieza.</p>
        </div>
      ) : (
        <section className="analysis-panel" style={{ marginTop: '1.5rem' }}>
          <div className="step-heading">
            <span>01</span>
            <div>
              <h3>Selecciona el CSV limpio</h3>
              <p>Los encabezados y datos se sincronizarán con el archivo seleccionado.</p>
            </div>
          </div>
          <select
            className="form-input"
            value={activeFile?.id ?? ''}
            onChange={(event) => handleFileChange(event.target.value)}
            style={{ maxWidth: '400px', marginBottom: '1.5rem' }}
          >
            {cleanFiles.map((file) => (
              <option key={file.id} value={file.id}>
                {file.name} · {file.rows.length} registros
              </option>
            ))}
          </select>

          <div className="step-heading">
            <span>02</span>
            <div>
              <h3>Mapea las columnas</h3>
              <p>Fecha, categoría y monto son obligatorios. Cantidad es opcional para calcular unidades vendidas.</p>
            </div>
          </div>
          {activeFile && (
            <div className="analysis-fields" style={{ marginBottom: '1.5rem' }}>
              <label className="form-group">
                <span className="form-label">Columna de fecha *</span>
                <select
                  className="form-input"
                  value={selection.fecha ?? ''}
                  onChange={(event) => handleColumnChange('fecha', event.target.value)}
                >
                  <option value="">Selecciona un header</option>
                  {activeFile.headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </label>

              <label className="form-group">
                <span className="form-label">Columna de categoría *</span>
                <select
                  className="form-input"
                  value={selection.categoria ?? ''}
                  onChange={(event) => handleColumnChange('categoria', event.target.value)}
                >
                  <option value="">Selecciona un header</option>
                  {activeFile.headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </label>

              <label className="form-group">
                <span className="form-label">Columna de monto *</span>
                <select
                  className="form-input"
                  value={selection.monto ?? ''}
                  onChange={(event) => handleColumnChange('monto', event.target.value)}
                >
                  <option value="">Selecciona un header</option>
                  {activeFile.headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </label>

              <label className="form-group">
                <span className="form-label">Columna de cantidad (opcional)</span>
                <select
                  className="form-input"
                  value={selection.cantidad ?? ''}
                  onChange={(event) => handleColumnChange('cantidad', event.target.value)}
                >
                  <option value="">Sin seleccionar</option>
                  {activeFile.headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {!resultado && (
            <div className="empty-state" style={{ padding: '2rem', marginTop: '1rem', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
              <p className="hint-text" style={{ margin: 0 }}>
                Selecciona al menos las columnas de <strong>fecha</strong>, <strong>categoría</strong> y <strong>monto</strong> para calcular el reporte comercial.
              </p>
            </div>
          )}

          {resultado && (
            <ResultadoVentas
              resultado={resultado}
              onGuardar={handleGuardarReporte}
              guardado={guardado}
            />
          )}
        </section>
      )}
    </div>
  );
}

interface ResultadoVentasProps {
  resultado: ResultadoCalculoVentas;
  onGuardar: () => void;
  guardado: boolean;
}

function ResultadoVentas({ resultado, onGuardar, guardado }: ResultadoVentasProps) {
  const { metricas, graficoPorCategoria, graficoPorFecha, participacionCategoria, graficoUnidadesPorCategoria } = resultado;

  return (
    <div className="resultado-ventas" style={{ marginTop: '2rem' }}>
      {/* TARJETAS KPI DE ALTO IMPACTO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ingreso Total</span>
            <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>
              ${metricas.ingresoTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={22} strokeWidth={2.2} />
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ticket Promedio</span>
            <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>
              ${metricas.ticketPromedio.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={22} strokeWidth={2.2} />
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoría Top</span>
            <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={metricas.categoriaTop}>
              {metricas.categoriaTop || 'N/A'}
            </h3>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={22} strokeWidth={2.2} />
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transacciones</span>
            <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>
              {metricas.numeroTransacciones.toLocaleString()}
            </h3>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Receipt size={22} strokeWidth={2.2} />
          </div>
        </div>

        {metricas.unidadesTotales !== undefined && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unidades Vendidas</span>
              <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>
                {metricas.unidadesTotales.toLocaleString()}
              </h3>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={22} strokeWidth={2.2} />
            </div>
          </div>
        )}
      </div>

      {/* GRID DE GRÁFICOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        
        {/* GRÁFICO DE PASTEL / DONA: PARTICIPACIÓN POR CATEGORÍA */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PieIcon size={18} strokeWidth={2.2} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>Participación por Categoría</h4>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Distribución porcentual de ingresos (Gráfico Pastel)</p>
              </div>
            </div>
          </div>

          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={participacionCategoria}
                  dataKey="porcentaje"
                  nameKey="categoria"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  paddingAngle={3}
                  stroke="#ffffff"
                  strokeWidth={2}
                  label={(entry) => {
                    const punto = entry as unknown as PuntoParticipacion;
                    return `${punto.categoria} (${punto.porcentaje.toFixed(1)}%)`;
                  }}
                >
                  {participacionCategoria.map((_, index) => (
                    <Cell key={index} fill={COLORES_PASTEL[index % COLORES_PASTEL.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) => {
                    const numeric = Number(value ?? 0);
                    return [`${numeric.toFixed(1)}%`, 'Participación'];
                  }}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', color: '#475569', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Mini desglose visual con barras */}
          <div style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {participacionCategoria.map((item, index) => {
              const color = COLORES_PASTEL[index % COLORES_PASTEL.length];
              return (
                <div key={item.categoria} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.categoria}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '140px' }}>
                    <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(item.porcentaje, 100)}%`, height: '100%', background: color, borderRadius: '3px' }} />
                    </div>
                    <span style={{ fontWeight: 600, color: '#0f172a', width: '42px', textAlign: 'right' }}>
                      {item.porcentaje.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRÁFICO DE BARRAS: INGRESO POR CATEGORÍA */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={18} strokeWidth={2.2} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>Ingreso por Categoría</h4>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Monto total recaudado por cada categoría</p>
              </div>
            </div>
          </div>

          <div style={{ height: '340px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficoPorCategoria} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(value: unknown) => {
                    const numeric = Number(value ?? 0);
                    return [`$${numeric.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Total Ingreso'];
                  }}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]}>
                  {graficoPorCategoria.map((_, index) => (
                    <Cell key={`bar-${index}`} fill={COLORES_PASTEL[index % COLORES_PASTEL.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO DE LÍNEA: TENDENCIA EN EL TIEMPO */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#cffafe', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={18} strokeWidth={2.2} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>Tendencia de Ingresos</h4>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Evolución temporal de las ventas</p>
              </div>
            </div>
          </div>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graficoPorFecha} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(value: unknown) => {
                    const numeric = Number(value ?? 0);
                    return [`$${numeric.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Total Ingreso'];
                  }}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)',
                    fontSize: '13px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#06b6d4' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO DE UNIDADES VENDIDAS (SI APLICA) */}
        {graficoUnidadesPorCategoria && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>Unidades por Categoría</h4>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Volumen total de piezas o ítems vendidos</p>
                </div>
              </div>
            </div>

            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graficoUnidadesPorCategoria} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(value: unknown) => {
                      const numeric = Number(value ?? 0);
                      return [`${numeric.toLocaleString()} u.`, 'Unidades'];
                    }}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* BOTÓN GUARDAR REPORTE */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onGuardar}
          disabled={guardado}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            width: 'auto',
            padding: '0.75rem 1.5rem',
            backgroundColor: guardado ? '#10b981' : '#2563eb',
          }}
        >
          {guardado ? (
            <>
              <Check size={18} strokeWidth={2.5} /> Reporte guardado con éxito
            </>
          ) : (
            <>
              <Save size={18} strokeWidth={2.2} /> Guardar reporte comercial
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Ventas;