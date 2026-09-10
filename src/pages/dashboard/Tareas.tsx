import { useEffect, useState, type SyntheticEvent } from 'react';
import { CheckCircle2, ClipboardList, Play, Plus, X } from 'lucide-react';
import { completarTarea, crearTarea, listarTareas, tomarTarea } from '../../services/tareaService';
import type { Tarea } from '../../types/tarea';
import { getCurrentUser } from '../../utils/auth';

type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA';

const PRIORIDAD_LABEL: Record<Prioridad, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
};

function Tareas() {
  const usuario = getCurrentUser();
  const esAnalista = usuario?.role === 'ANALISTA';
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'MEDIA' as Prioridad,
    columnaRelacionada: '',
    datasetOtroId: '',
    asignadaA: '',
  });

  const cargarTareas = async () => {
    setLoading(true);
    try {
      setTareas(await listarTareas());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las tareas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarTareas();
  }, []);

  const handleCrear = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!usuario || !form.titulo.trim() || !form.descripcion.trim()) return;

    setError(null);
    try {
      const tarea = await crearTarea({
        titulo: `[${PRIORIDAD_LABEL[form.prioridad]}] ${form.titulo.trim()}`,
        descripcion: form.descripcion.trim(),
        columnaRelacionada: form.columnaRelacionada.trim() || undefined,
        datasetOtroId: form.datasetOtroId.trim() || undefined,
        creadaPor: usuario.id,
        asignadaA: form.asignadaA.trim() || undefined,
      });
      setTareas((actuales) => [...actuales, tarea]);
      setForm({ titulo: '', descripcion: '', prioridad: 'MEDIA', columnaRelacionada: '', datasetOtroId: '', asignadaA: '' });
      setMostrarFormulario(false);
      setMensaje('Tarea asignada correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la tarea.');
    }
  };

  const actualizarTarea = async (accion: () => Promise<Tarea>, mensajeExito: string) => {
    setError(null);
    try {
      const actualizada = await accion();
      setTareas((actuales) => actuales.map((tarea) => (tarea.id === actualizada.id ? actualizada : tarea)));
      setMensaje(mensajeExito);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la tarea.');
    }
  };

  const tareasVisibles = esAnalista || !usuario
    ? tareas
    : tareas.filter((tarea) => (!tarea.asignadaA || tarea.asignadaA === usuario.id) && (!tarea.tomadaPor || tarea.tomadaPor === usuario.id));

  return (
    <div className="dashboard-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2>Tareas de análisis</h2>
          <p>Convierte los hallazgos del análisis en acciones concretas para el equipo.</p>
        </div>
        {esAnalista && (
          <button type="button" className="btn btn-primary" onClick={() => setMostrarFormulario((visible) => !visible)}>
            {mostrarFormulario ? <X size={16} /> : <Plus size={16} />}
            {mostrarFormulario ? 'Cerrar' : 'Asignar tarea'}
          </button>
        )}
      </div>

      {mensaje && <div className="alert-success" role="status">{mensaje}</div>}
      {error && <div className="alert-error" role="alert">{error}</div>}

      {esAnalista && mostrarFormulario && (
        <form className="dashboard-card" onSubmit={handleCrear} style={{ marginBottom: '1rem' }}>
          <h3>Nueva asignación</h3>
          <div className="form-group">
            <label htmlFor="tarea-titulo" className="form-label">Asunto</label>
            <input id="tarea-titulo" className="form-input" value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} placeholder="Ej. Completar columna de descuentos" required />
          </div>
          <div className="form-group">
            <label htmlFor="tarea-descripcion" className="form-label">Qué debe verificar o cambiar el trabajador</label>
            <textarea id="tarea-descripcion" className="form-input" rows={4} value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} placeholder="Ej. Revisar los productos sin descuento y comparar su precio con la competencia. Proponer un ajuste razonable para aprobación." required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="tarea-prioridad" className="form-label">Prioridad</label>
              <select id="tarea-prioridad" className="form-input" value={form.prioridad} onChange={(event) => setForm({ ...form, prioridad: event.target.value as Prioridad })}>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="tarea-columna" className="form-label">Columna relacionada</label>
              <input id="tarea-columna" className="form-input" value={form.columnaRelacionada} onChange={(event) => setForm({ ...form, columnaRelacionada: event.target.value })} placeholder="descuento, precio" />
            </div>
            <div className="form-group">
              <label htmlFor="tarea-dataset" className="form-label">ID del dataset (opcional)</label>
              <input id="tarea-dataset" className="form-input" value={form.datasetOtroId} onChange={(event) => setForm({ ...form, datasetOtroId: event.target.value })} placeholder="ID del archivo" />
            </div>
            <div className="form-group">
              <label htmlFor="tarea-trabajador" className="form-label">ID del trabajador (opcional)</label>
              <input id="tarea-trabajador" className="form-input" value={form.asignadaA} onChange={(event) => setForm({ ...form, asignadaA: event.target.value })} placeholder="ID de la cuenta" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Asignar al equipo</button>
        </form>
      )}

      <div className="dashboard-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <ClipboardList size={20} />
          <h3 style={{ margin: 0 }}>{esAnalista ? 'Asignaciones del equipo' : 'Mis tareas'}</h3>
        </div>
        {loading && <p>Cargando tareas...</p>}
        {!loading && !tareasVisibles.length && <p>No hay tareas asignadas todavía.</p>}
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {tareasVisibles.map((tarea) => (
            <article key={tarea.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.35rem' }}>{tarea.titulo}</h4>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{tarea.descripcion}</p>
                </div>
                <strong>{tarea.estado === 'COMPLETADA' ? 'Completada' : tarea.estado === 'EN_PROGRESO' ? 'En progreso' : 'Pendiente'}</strong>
              </div>
              {(tarea.columnaRelacionada || tarea.datasetOtroId) && (
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 0 }}>
                  {tarea.columnaRelacionada && `Columna: ${tarea.columnaRelacionada}`}
                  {tarea.columnaRelacionada && tarea.datasetOtroId && ' · '}
                  {tarea.datasetOtroId && `Dataset: ${tarea.datasetOtroId}`}
                </p>
              )}
              {!esAnalista && usuario && tarea.estado === 'PENDIENTE' && (
                <button type="button" className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={() => void actualizarTarea(() => tomarTarea(tarea.id, usuario.id), 'Tarea tomada.') }>
                  <Play size={15} /> Tomar tarea
                </button>
              )}
              {!esAnalista && tarea.estado === 'EN_PROGRESO' && tarea.tomadaPor === usuario?.id && (
                <button type="button" className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={() => void actualizarTarea(() => completarTarea(tarea.id), 'Tarea completada.') }>
                  <CheckCircle2 size={15} /> Marcar como completada
                </button>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Tareas;
