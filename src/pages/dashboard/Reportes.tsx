import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { DashboardContextType } from '../../types/csv';
import type { VentaReporte } from '../../types/ventas';
import { obtenerReportes } from '../../utils/reportesStorage';

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
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}