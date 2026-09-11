import { useEffect, useMemo, useState } from 'react';
import { MailCheck, MessageSquareText, Send, UserRound } from 'lucide-react';
import {
  actualizarEstadoSolicitud,
  listarSolicitudes,
  obtenerResumenSolicitudes,
  type Solicitud,
  type SolicitudEstado,
} from '../../services/solicitudesService';

const ESTADO_LABEL: Record<SolicitudEstado, string> = {
  NUEVA: 'Nueva',
  PENDIENTE: 'Pendiente',
  ATENDIDA: 'Atendida',
};

const ESTADO_COLORS: Record<SolicitudEstado, { bg: string; text: string; border: string }> = {
  NUEVA: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  PENDIENTE: { bg: '#fff7ed', text: '#c2410c', border: '#fdba74' },
  ATENDIDA: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
};

function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);

  const cargarSolicitudes = () => {
    setSolicitudes(listarSolicitudes());
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const resumen = useMemo(() => obtenerResumenSolicitudes(), [solicitudes]);

  const cambiarEstado = (id: string, estado: SolicitudEstado) => {
    const actualizada = actualizarEstadoSolicitud(id, estado);
    if (!actualizada) return;
    setSolicitudes((actuales) => actuales.map((solicitud) => (solicitud.id === id ? { ...solicitud, estado } : solicitud)));
  };

  return (
    <div className="dashboard-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <h2>Solicitudes</h2>
          <p>Leads y consultas recibidas desde la landing page y el formulario de contacto.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="metric-card" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Total</div>
          <div style={{ marginTop: '0.45rem', fontSize: '1.8rem', fontWeight: 700, color: '#0f172a' }}>{resumen.total}</div>
        </div>
        <div className="metric-card" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Nuevas</div>
          <div style={{ marginTop: '0.45rem', fontSize: '1.8rem', fontWeight: 700, color: '#2563eb' }}>{resumen.nuevas}</div>
        </div>
        <div className="metric-card" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Pendientes</div>
          <div style={{ marginTop: '0.45rem', fontSize: '1.8rem', fontWeight: 700, color: '#c2410c' }}>{resumen.pendientes}</div>
        </div>
        <div className="metric-card" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Atendidas</div>
          <div style={{ marginTop: '0.45rem', fontSize: '1.8rem', fontWeight: 700, color: '#047857' }}>{resumen.atendidas}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="dashboard-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#2563eb' }}>
            <Send size={18} />
            <strong>Landing</strong>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.5rem', color: '#0f172a' }}>{resumen.landing}</div>
        </div>
        <div className="dashboard-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#0f766e' }}>
            <MessageSquareText size={18} />
            <strong>Contacto</strong>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.5rem', color: '#0f172a' }}>{resumen.contacto}</div>
        </div>
      </div>

      {!solicitudes.length ? (
        <div className="dashboard-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <MailCheck size={36} style={{ margin: '0 auto 0.75rem', color: '#64748b' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No hay solicitudes todavía</h3>
          <p>Cuando envíes una consulta desde la landing o desde contacto, aparecerá aquí.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {solicitudes.map((solicitud) => (
            <article key={solicitud.id} className="dashboard-card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <UserRound size={16} color="#475569" />
                    <strong style={{ color: '#0f172a' }}>{solicitud.nombre}</strong>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{solicitud.email}</div>
                </div>
                <span
                  style={{
                    background: ESTADO_COLORS[solicitud.estado].bg,
                    color: ESTADO_COLORS[solicitud.estado].text,
                    border: `1px solid ${ESTADO_COLORS[solicitud.estado].border}`,
                    borderRadius: '999px',
                    padding: '0.35rem 0.7rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {ESTADO_LABEL[solicitud.estado]}
                </span>
              </div>

              <div style={{ marginTop: '0.9rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Fuente</div>
                  <div style={{ marginTop: '0.15rem', fontWeight: 600 }}>{solicitud.fuente === 'LANDING' ? 'Landing page' : 'Contacto'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Teléfono</div>
                  <div style={{ marginTop: '0.15rem', fontWeight: 600 }}>{solicitud.telefono || 'No indicado'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Fecha</div>
                  <div style={{ marginTop: '0.15rem', fontWeight: 600 }}>{new Date(solicitud.createdAt).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Asunto</div>
                <div style={{ marginTop: '0.2rem', fontWeight: 600 }}>{solicitud.asunto}</div>
              </div>

              <div style={{ marginTop: '0.85rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Mensaje</div>
                <p style={{ marginTop: '0.2rem', whiteSpace: 'pre-wrap', color: '#334155' }}>{solicitud.mensaje}</p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem 0.9rem', marginTop: 0 }} onClick={() => cambiarEstado(solicitud.id, 'PENDIENTE')}>
                  Marcar pendiente
                </button>
                <button type="button" className="btn btn-primary" style={{ width: 'auto', padding: '0.5rem 0.9rem' }} onClick={() => cambiarEstado(solicitud.id, 'ATENDIDA')}>
                  Marcar atendida
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Solicitudes;