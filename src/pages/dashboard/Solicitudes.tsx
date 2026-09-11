import { useEffect, useMemo, useState } from 'react';
import { MailCheck, UserRound } from 'lucide-react';
import {
  editarRespuestaSolicitud,
  listarSolicitudes,
  obtenerResumenSolicitudes,
  responderSolicitud,
  type Solicitud,
  type SolicitudEstado,
} from '../../services/solicitudesService';

const ESTADO_LABEL: Record<SolicitudEstado, string> = {
  PENDIENTE: 'Pendiente',
  RESPONDIDA: 'Respondida',
};

const ESTADO_COLORS: Record<SolicitudEstado, { bg: string; text: string; border: string }> = {
  PENDIENTE: { bg: '#fff7ed', text: '#c2410c', border: '#fdba74' },
  RESPONDIDA: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
};

function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const cargarSolicitudes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarSolicitudes();
      setSolicitudes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarSolicitudes();
  }, []);

  const resumen = useMemo(() => obtenerResumenSolicitudes(solicitudes), [solicitudes]);

  const handleGuardarRespuesta = async (solicitud: Solicitud) => {
    const respuesta = (respuestas[solicitud.id] ?? solicitud.respuesta ?? '').trim();
    if (!respuesta) {
      setError('Escribe una respuesta antes de guardar.');
      return;
    }

    setError(null);
    setSuccess(null);
    setSavingId(solicitud.id);

    try {
      const actualizada = solicitud.estado === 'RESPONDIDA'
        ? await editarRespuestaSolicitud(solicitud.id, respuesta)
        : await responderSolicitud(solicitud.id, respuesta);

      setSolicitudes((actuales) => actuales.map((item) => (item.id === actualizada.id ? actualizada : item)));
      setRespuestas((actual) => ({ ...actual, [actualizada.id]: actualizada.respuesta ?? '' }));
      setSuccess(solicitud.estado === 'RESPONDIDA' ? 'Respuesta actualizada correctamente.' : 'Respuesta enviada correctamente al cliente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la respuesta.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="dashboard-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <h2>Solicitudes</h2>
          <p>Consultas recibidas desde la landing page y contacto, con respuesta por parte del analista.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="metric-card" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Total</div>
          <div style={{ marginTop: '0.45rem', fontSize: '1.8rem', fontWeight: 700, color: '#0f172a' }}>{resumen.total}</div>
        </div>
        <div className="metric-card" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Pendientes</div>
          <div style={{ marginTop: '0.45rem', fontSize: '1.8rem', fontWeight: 700, color: '#c2410c' }}>{resumen.pendientes}</div>
        </div>
        <div className="metric-card" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Respondidas</div>
          <div style={{ marginTop: '0.45rem', fontSize: '1.8rem', fontWeight: 700, color: '#047857' }}>{resumen.respondidas}</div>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {success && <div className="alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

      {loading ? (
        <div className="dashboard-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Cargando solicitudes...</p>
        </div>
      ) : !solicitudes.length ? (
        <div className="dashboard-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <MailCheck size={36} style={{ margin: '0 auto 0.75rem', color: '#64748b' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No hay solicitudes todavía</h3>
          <p>Aquí aparecerán las consultas recibidas desde la landing y contacto.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {solicitudes.map((solicitud) => (
            <article key={solicitud.id} className="dashboard-card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <UserRound size={16} color="#475569" />
                    <strong style={{ color: '#0f172a' }}>{solicitud.nombreCompleto}</strong>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{solicitud.correo}</div>
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
                  <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Teléfono</div>
                  <div style={{ marginTop: '0.15rem', fontWeight: 600 }}>{solicitud.telefono || 'No indicado'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Fecha</div>
                  <div style={{ marginTop: '0.15rem', fontWeight: 600 }}>{new Date(solicitud.createdAt).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                </div>
                {solicitud.respondidaAt && (
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Respondida</div>
                    <div style={{ marginTop: '0.15rem', fontWeight: 600 }}>{new Date(solicitud.respondidaAt).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Mensaje</div>
                <p style={{ marginTop: '0.2rem', whiteSpace: 'pre-wrap', color: '#334155' }}>{solicitud.mensaje}</p>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, marginBottom: '0.4rem' }}>
                  {solicitud.estado === 'RESPONDIDA' ? 'Editar respuesta' : 'Responder solicitud'}
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={respuestas[solicitud.id] ?? solicitud.respuesta ?? ''}
                  onChange={(event) => setRespuestas((actual) => ({ ...actual, [solicitud.id]: event.target.value }))}
                  placeholder="Escribe la respuesta para el cliente..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '0.5rem 0.9rem' }}
                  disabled={savingId === solicitud.id}
                  onClick={() => void handleGuardarRespuesta(solicitud)}
                >
                  {savingId === solicitud.id ? 'Guardando...' : (solicitud.estado === 'RESPONDIDA' ? 'Actualizar respuesta' : 'Enviar respuesta')}
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