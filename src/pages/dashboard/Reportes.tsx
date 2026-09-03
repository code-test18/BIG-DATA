import {
  Award,
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  FileSpreadsheet,
  Package,
  PieChart as PieIcon,
  Receipt,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
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

import type { VentaReporte } from '../../types/ventas';
import { obtenerReportes } from '../../utils/reportesStorage';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';


export default function Reportes() {
  const { activeFileId } = useOutletContext<DashboardContextType>();
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<VentaReporte | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reportes = useMemo(() => obtenerReportes(), [activeFileId, reloadKey]);

  // Si no hay reporte seleccionado y hay reportes disponibles, seleccionar el primero
  const reporteActual =
    reporteSeleccionado && reportes.some((r) => r.id === reporteSeleccionado.id)
      ? reportes.find((r) => r.id === reporteSeleccionado.id)!
      : reportes[0] ?? null;

  const handleEliminar = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm('¿Estás seguro de que deseas eliminar este reporte?')) {
      eliminarReporte(id);
      setReloadKey((prev) => prev + 1);
      if (reporteSeleccionado?.id === id) {
        setReporteSeleccionado(null);
      }
    }
  };

  const handleDescargarJSON = (reporte: VentaReporte) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reporte, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${reporte.nombre.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!reportes.length) {
    return (
      <div className="dashboard-page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2>Reportes Guardados</h2>
            <p>Historial y visualización de reportes comerciales y análisis generados.</p>
          </div>
        </div>

        <div
          className="empty-state"
          style={{
            background: '#ffffff',
            border: '1px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '2rem auto',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <BarChart3 size={28} strokeWidth={2.2} />
          </div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a', fontSize: '1.25rem' }}>Todavía no has guardado ningún reporte</h3>
          <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.95rem' }}>
            Genera análisis desde el módulo de Ventas o Procesar y guárdalos para consultarlos aquí en cualquier momento.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/dashboard/ventas')}
              style={{ width: 'auto', padding: '0.65rem 1.25rem' }}
            >
              Ir a Ventas
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard/procesar')}
              style={{ width: 'auto', padding: '0.65rem 1.25rem' }}
            >
              Ir a Procesar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper para renderizar métricas
  const renderMetricas = (reporte: VentaReporte) => {
    if (Array.isArray(reporte.metricas)) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          {reporte.metricas.map((metrica) => (
            <div key={metrica.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                {metrica.label}
              </span>
              <div style={{ marginTop: '0.4rem', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
                {metrica.value}
              </div>
            </div>
          ))}
        </div>
      );
    }

    const m = reporte.metricas as MetricasVentas;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ingreso Total</span>
            <div style={{ marginTop: '0.35rem', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
              ${m.ingresoTotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
            </div>
          </div>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={20} />
          </div>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ticket Promedio</span>
            <div style={{ marginTop: '0.35rem', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
              ${m.ticketPromedio?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
            </div>
          </div>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} />
          </div>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoría Top</span>
            <div style={{ marginTop: '0.35rem', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }} title={m.categoriaTop}>
              {m.categoriaTop || 'N/A'}
            </div>
          </div>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={20} />
          </div>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transacciones</span>
            <div style={{ marginTop: '0.35rem', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
              {m.numeroTransacciones?.toLocaleString() ?? 0}
            </div>
          </div>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Receipt size={20} />
          </div>
        </div>

        {m.unidadesTotales !== undefined && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unidades</span>
              <div style={{ marginTop: '0.35rem', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
                {m.unidadesTotales.toLocaleString()}
              </div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2>Reportes Guardados</h2>
          <p>Consulta, analiza y exporta tus reportes guardados previamente.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#64748b' }}>
          <FileSpreadsheet size={16} color="#2563eb" />
          <span>Total: <strong>{reportes.length}</strong> {reportes.length === 1 ? 'reporte' : 'reportes'}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* LISTA LATERAL DE REPORTES */}
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {reportes.map((reporte) => {
            const isSelected = reporteActual?.id === reporte.id;
            return (
              <div
                key={reporte.id}
                role="button"
                tabIndex={0}
                onClick={() => setReporteSeleccionado(reporte)}
                onKeyDown={(e) => { if (e.key === 'Enter') setReporteSeleccionado(reporte); }}
                style={{
                  textAlign: 'left',
                  padding: '1.1rem',
                  borderRadius: '12px',
                  border: `1px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.08)' : '0 1px 3px rgba(0,0,0,0.03)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ fontWeight: 700, color: isSelected ? '#1d4ed8' : '#0f172a', fontSize: '0.95rem' }}>
                    {reporte.nombre}
                  </div>
                  <button
                    type="button"
                    title="Eliminar reporte"
                    onClick={(e) => handleEliminar(reporte.id, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '0.2rem',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={13} />
                  <span>{reporte.fecha}</span>
                </div>

                {reporte.nombreArchivo && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '0.6rem',
                      padding: '0.15rem 0.5rem',
                      background: isSelected ? '#dbeafe' : '#f1f5f9',
                      color: isSelected ? '#1e40af' : '#475569',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}
                  >
                    {reporte.nombreArchivo}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* DETALLE Y GRÁFICOS DEL REPORTE SELECCIONADO */}
        {reporteActual && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {/* ENCABEZADO DEL REPORTE */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', letterSpacing: '0.08em', color: '#2563eb', textTransform: 'uppercase', fontWeight: 700 }}>
                  Reporte Detallado
                </span>
                <h3 style={{ margin: '0.25rem 0 0', color: '#0f172a', fontSize: '1.4rem' }}>{reporteActual.nombre}</h3>
                <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Generado el {reporteActual.fecha} · Archivo base: <strong>{reporteActual.nombreArchivo}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleDescargarJSON(reporteActual)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: 'auto', padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                >
                  <Download size={15} /> Exportar JSON
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleEliminar(reporteActual.id)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: 'auto', padding: '0.5rem 0.9rem', fontSize: '0.85rem', color: '#dc2626' }}
                >
                  <Trash2 size={15} /> Eliminar
                </button>
              </div>
            </div>

            {/* MÉTRICAS KPI */}
            {renderMetricas(reporteActual)}

            {/* GRÁFICOS GUARDADOS DEL REPORTE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
              {/* Gráfico de Pastel (Participación) */}
              {reporteActual.participacionCategoria && reporteActual.participacionCategoria.length > 0 && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <PieIcon size={18} color="#4f46e5" />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>Participación por Categoría</h4>
                  </div>
                  <div style={{ height: '240px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reporteActual.participacionCategoria}
                          dataKey="porcentaje"
                          nameKey="categoria"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={80}
                          paddingAngle={3}
                          stroke="#ffffff"
                          strokeWidth={2}
                          label={(entry) => {
                            const punto = entry as unknown as PuntoParticipacion;
                            return `${punto.categoria}: ${punto.porcentaje.toFixed(1)}%`;
                          }}
                        >
                          {reporteActual.participacionCategoria.map((_, index) => (
                            <Cell key={`pie-${index}`} fill={COLORES_PASTEL[index % COLORES_PASTEL.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: unknown) => {
                            const numeric = Number(value ?? 0);
                            return [`${numeric.toFixed(1)}%`, 'Participación'];
                          }}
                        />
                        <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Gráfico de Barras (Ingreso por Categoría) */}
              {reporteActual.graficoPorCategoria && reporteActual.graficoPorCategoria.length > 0 && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <BarChart3 size={18} color="#2563eb" />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>Ingreso por Categoría</h4>
                  </div>
                  <div style={{ height: '240px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reporteActual.graficoPorCategoria} margin={{ top: 5, right: 5, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                        <Tooltip formatter={(value: unknown) => [`$${Number(value ?? 0).toLocaleString()}`, 'Total']} />
                        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                          {reporteActual.graficoPorCategoria.map((_, index) => (
                            <Cell key={`bar-${index}`} fill={COLORES_PASTEL[index % COLORES_PASTEL.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Gráfico de Línea (Tendencia de Ingresos) */}
              {reporteActual.graficoPorFecha && reporteActual.graficoPorFecha.length > 0 && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <TrendingUp size={18} color="#06b6d4" />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>Tendencia en el Tiempo</h4>
                  </div>
                  <div style={{ height: '240px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={reporteActual.graficoPorFecha} margin={{ top: 5, right: 5, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                        <Tooltip formatter={(value: unknown) => [`$${Number(value ?? 0).toLocaleString()}`, 'Total']} />
                        <Line type="monotone" dataKey="total" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Gráfico de Unidades Vendidas */}
              {reporteActual.graficoUnidadesPorCategoria && reporteActual.graficoUnidadesPorCategoria.length > 0 && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Package size={18} color="#10b981" />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>Unidades por Categoría</h4>
                  </div>

                  <ReporteGraficos reporte={reporteSeleccionado} />
                </>

              )}
            </div>

            {/* RESUMEN DEL REPORTE */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
              <div style={{ color: '#2563eb', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
                Resumen Ejecutivo
              </div>
              <p style={{ margin: '0.5rem 0 0', color: '#334155', lineHeight: 1.6, fontSize: '0.92rem' }}>
                {reporteActual.resumen}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReporteGraficos({ reporte }: { reporte: VentaReporte }) {
  const comparativa = reporte.graficoComparativoCategoria;
  const tendencia = reporte.graficoComparativoMes;
  const tieneComparativa = Boolean(comparativa?.length || tendencia?.length);
  const tieneGraficosVentas = Boolean(reporte.graficoPorCategoria?.length || reporte.graficoPorFecha?.length || reporte.participacionCategoria?.length);

  if (!tieneComparativa && !tieneGraficosVentas) {
    return <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #fde68a', borderRadius: '10px', background: '#fffbeb', color: '#92400e' }}>Este reporte no contiene datos gráficos guardados.</div>;
  }

  const names = reporte.nombresDatasets ?? { a: 'Dataset A', b: 'Dataset B' };
  return <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1.5rem' }}>
    <h4 style={{ margin: 0, color: '#0f172a' }}>Gráficos y comparativas</h4>
    {tendencia?.length ? <div style={chartBox}><h5 style={chartTitle}>Evolución de ingresos</h5><ResponsiveContainer width="100%" height={260}><LineChart data={tendencia}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" /><YAxis /><Tooltip /><Legend /><Line name={names.a} dataKey="datasetA" stroke="#2563eb" strokeWidth={2.5} /><Line name={names.b} dataKey="datasetB" stroke="#d946ef" strokeWidth={2.5} /></LineChart></ResponsiveContainer></div> : null}
    {comparativa?.length ? <div style={chartBox}><h5 style={chartTitle}>Ingresos por categoría</h5><ResponsiveContainer width="100%" height={260}><BarChart data={comparativa}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" /><YAxis /><Tooltip /><Legend /><Bar name={names.a} dataKey="datasetA" fill="#2563eb" /><Bar name={names.b} dataKey="datasetB" fill="#d946ef" /></BarChart></ResponsiveContainer></div> : null}
    {reporte.participacionCategoriaA?.length || reporte.participacionCategoriaB?.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}><PieReport title={names.a} data={reporte.participacionCategoriaA ?? []} color="#2563eb" /><PieReport title={names.b} data={reporte.participacionCategoriaB ?? []} color="#d946ef" /></div> : null}
    {reporte.graficoPorCategoria?.length ? <div style={chartBox}><h5 style={chartTitle}>Gráfico del reporte</h5><ResponsiveContainer width="100%" height={260}><BarChart data={reporte.graficoPorCategoria}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="total" fill="#2563eb" /></BarChart></ResponsiveContainer></div> : null}
    {reporte.graficoPorFecha?.length ? <div style={chartBox}><h5 style={chartTitle}>Evolución por fecha</h5><ResponsiveContainer width="100%" height={260}><LineChart data={reporte.graficoPorFecha}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Line dataKey="total" stroke="#2563eb" strokeWidth={2.5} /></LineChart></ResponsiveContainer></div> : null}
    {reporte.participacionCategoria?.length ? <PieReport title="Participación por categoría" data={reporte.participacionCategoria} color="#2563eb" /> : null}
    {reporte.productosDatasetA?.length || reporte.productosDatasetB?.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}><ProductReport title={names.a} products={reporte.productosDatasetA ?? []} color="#2563eb" /><ProductReport title={names.b} products={reporte.productosDatasetB ?? []} color="#d946ef" /></div> : null}
  </div>;
}

const chartBox = { border: '1px solid #dbe4ef', borderRadius: '10px', background: '#f8fafc', padding: '1rem' };
const chartTitle = { margin: '0 0 0.75rem', color: '#334155', fontSize: '0.9rem' };

function PieReport({ title, data, color }: { title: string; data: Array<{ categoria: string; porcentaje: number }>; color: string }) {
  const pieData = data.map((item) => ({ name: item.categoria, value: item.porcentaje }));
  return <div style={chartBox}><h5 style={{ ...chartTitle, color }}>{title}</h5><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="78%">{pieData.map((item, index) => <Cell key={item.name} fill={`${color}${['', '99', '66', '44', '22'][index % 5]}`} />)}</Pie><Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} /></PieChart></ResponsiveContainer></div>;
}

function ProductReport({ title, products, color }: { title: string; products: Array<{ producto: string; unidades: number; ingresos: number }>; color: string }) {
  return <div style={chartBox}><h5 style={{ ...chartTitle, color }}>{title} - productos principales</h5>{products.map((product) => <div key={product.producto} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.45rem 0', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem' }}><span>{product.producto}</span><strong>{product.ingresos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong></div>)}</div>;
}