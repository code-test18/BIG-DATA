import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { DashboardContextType } from '../../types/csv';
import type { VentaReporte } from '../../types/ventas';
import { obtenerReportes } from '../../utils/reportesStorage';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function Reportes() {
  const { activeFileId } = useOutletContext<DashboardContextType>();
  const [reporteSeleccionado, setReporteSeleccionado] = useState<VentaReporte | null>(null);

  const reportes = useMemo(() => obtenerReportes(), [activeFileId]);

  const abrirReporte = (reporte: VentaReporte) => {
    setReporteSeleccionado(reporte);
  };

  if (!reportes.length) {
    return (
      <div style={{ padding: '32px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1e293b' }}>Reportes exportados</h2>
        <p style={{ color: '#64748b' }}>Todavía no exportaste ningún reporte. Cuando lo hagas aparecerá aquí.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, color: '#0f172a' }}>Reportes exportados</h2>
            <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>Selecciona un reporte para verlo en detalle.</p>
          </div>
        </div>

        {!reportes.length ? (
          <div style={{ padding: '2rem', border: '1px solid #dbe4ef', borderRadius: '12px', background: '#fff', color: '#64748b', textAlign: 'center' }}>
            Todavía no exportaste ningún reporte. Cuando lo hagas aparecerá aquí.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 320px) 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {reportes.map((reporte) => (
                <button
                  key={reporte.id}
                  type="button"
                  onClick={() => abrirReporte(reporte)}
                  style={{
                    textAlign: 'left',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: `1px solid ${reporteSeleccionado?.id === reporte.id ? '#2563eb' : '#dbe4ef'}`,
                    background: reporteSeleccionado?.id === reporte.id ? '#eff6ff' : '#fff',
                    cursor: 'pointer',
                    color: '#0f172a',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{reporte.nombre}</div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: '#64748b' }}>{reporte.fecha}</div>
                </button>
              ))}
            </div>

            <div style={{ background: '#fff', border: '1px solid #dbe4ef', borderRadius: '12px', padding: '1.25rem' }}>
              {!reporteSeleccionado ? (
                <div style={{ color: '#64748b', padding: '1rem 0' }}>
                  Elige un reporte de la lista para ver sus detalles.
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', letterSpacing: '0.08em', color: '#2563eb', textTransform: 'uppercase', fontWeight: 700 }}>
                        Reporte seleccionado
                      </div>
                      <h3 style={{ margin: '0.35rem 0 0', color: '#0f172a' }}>{reporteSeleccionado.nombre}</h3>
                    </div>
                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{reporteSeleccionado.fecha}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    {(Array.isArray(reporteSeleccionado.metricas)
                      ? reporteSeleccionado.metricas
                      : Object.entries(reporteSeleccionado.metricas).map(([label, value]) => ({ label, value })))
                      .map((metrica) => (
                        <div key={metrica.label} style={{ border: '1px solid #dbe4ef', borderRadius: '10px', background: '#f8fafc', padding: '1rem' }}>
                          <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{metrica.label}</div>
                          <div style={{ marginTop: '0.5rem', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{metrica.value}</div>
                        </div>
                      ))}
                  </div>

                  <div style={{ marginTop: '1.5rem', border: '1px solid #dbe4ef', borderRadius: '10px', background: '#f8fafc', padding: '1rem' }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
                      Resumen
                    </div>
                    <p style={{ margin: '0.8rem 0 0', color: '#334155', lineHeight: 1.6 }}>{reporteSeleccionado.resumen}</p>
                  </div>

                  <ReporteGraficos reporte={reporteSeleccionado} />
                </>
              )}
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