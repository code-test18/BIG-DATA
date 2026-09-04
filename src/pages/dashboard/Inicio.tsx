import { ArrowRight, BarChart3, Briefcase, FolderKanban, Sparkles, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProjectCard {
  id: string;
  name: string;
  category: string;
  summary: string;
  updated: string;
  status: 'Activa' | 'Pendiente' | 'En revisión';
  accent: string;
  route: string;
  metrics: Array<{ label: string; value: string; detail: string }>;
  drivers: Array<{ label: string; value: string; tone: 'good' | 'warning' | 'neutral' }>;
  insights: string[];
  trend: number[];
  funnel: Array<{ label: string; percent: number; color: string }>;
}

const projectCards: ProjectCard[] = [
  {
    id: 'ventas',
    name: 'Ventas',
    category: 'Operación',
    summary: 'Análisis de ingresos, tendencias y comportamiento comercial por periodo.',
    updated: 'Hace 2 horas',
    status: 'Activa',
    accent: '#2563eb',
    route: '/dashboard/ventas',
    metrics: [
      { label: 'Asistencias', value: '92%', detail: 'Personal activo hoy' },
      { label: 'Actitudes', value: '88%', detail: 'Buenas prácticas' },
      { label: 'Ventas', value: '$84.2K', detail: 'vs. mes anterior' },
    ],
    drivers: [
      { label: 'Cumplimiento', value: '96%', tone: 'good' },
      { label: 'Puntualidad', value: '91%', tone: 'good' },
      { label: 'Riesgo', value: '7%', tone: 'warning' },
    ],
    insights: [
      'Se registró un incremento del 12% en la productividad del área comercial.',
      'La mayor concentración de asistencia se observa en los turnos matutinos.',
      'Las actitudes mejorarían con revisiones breves de cierre de jornada.',
    ],
    trend: [42, 48, 56, 59, 72, 80, 92],
    funnel: [
      { label: 'Prospectos', percent: 84, color: '#2563eb' },
      { label: 'Contacto', percent: 74, color: '#14b8a6' },
      { label: 'Cierre', percent: 66, color: '#8b5cf6' },
    ],
  },
  {
    id: 'procesar',
    name: 'Procesamiento',
    category: 'Datos',
    summary: 'Carga, limpieza y preparación de archivos para análisis avanzado.',
    updated: 'Hace 1 día',
    status: 'En revisión',
    accent: '#14b8a6',
    route: '/dashboard/procesar',
    metrics: [
      { label: 'Archivos', value: '148', detail: 'Procesados esta semana' },
      { label: 'Clean data', value: '94%', detail: 'Sin inconsistencias' },
      { label: 'Tiempo', value: '2.4h', detail: 'Promedio de revisión' },
    ],
    drivers: [
      { label: 'Validación', value: '97%', tone: 'good' },
      { label: 'Errores', value: '6%', tone: 'warning' },
      { label: 'Carga', value: '89%', tone: 'neutral' },
    ],
    insights: [
      'Se redujo el número de errores en formato de archivos de clientes.',
      'El flujo de limpieza está más estable para rutinas repetitivas.',
      'Queda reforzar validación de columnas en ventas regionales.',
    ],
    trend: [38, 41, 54, 63, 69, 74, 87],
    funnel: [
      { label: 'Carga', percent: 90, color: '#14b8a6' },
      { label: 'Limpieza', percent: 78, color: '#3b82f6' },
      { label: 'Validación', percent: 72, color: '#f59e0b' },
    ],
  },
  {
    id: 'inteligencia',
    name: 'Inteligencia',
    category: 'Negocio',
    summary: 'Modelado de estrategias, promociones y segmentación comercial.',
    updated: 'Hace 3 días',
    status: 'Activa',
    accent: '#8b5cf6',
    route: '/dashboard/Inteligencia',
    metrics: [
      { label: 'Actitudes', value: '90%', detail: 'Satisfacción general' },
      { label: 'Predicción', value: '84%', detail: 'Precisión del modelo' },
      { label: 'Leads', value: '1.3K', detail: 'Oportunidades generadas' },
    ],
    drivers: [
      { label: 'Retención', value: '92%', tone: 'good' },
      { label: 'Efectividad', value: '86%', tone: 'good' },
      { label: 'Cuidado', value: '11%', tone: 'warning' },
    ],
    insights: [
      'La segmentación por perfiles mejora la apertura de campañas comerciales.',
      'Las actitudes positivas se asocian con mejor retención del cliente.',
      'Se recomienda reforzar mensajes personalizados por canal.',
    ],
    trend: [35, 46, 57, 61, 74, 83, 90],
    funnel: [
      { label: 'Segmentos', percent: 82, color: '#8b5cf6' },
      { label: 'Campañas', percent: 76, color: '#2563eb' },
      { label: 'Conversión', percent: 70, color: '#14b8a6' },
    ],
  },
  {
    id: 'reportes',
    name: 'Reportes',
    category: 'Executive',
    summary: 'Resumen ejecutivo con indicadores clave y métricas comparativas.',
    updated: 'Hace 5 días',
    status: 'Pendiente',
    accent: '#f59e0b',
    route: '/dashboard/reportes',
    metrics: [
      { label: 'Eficiencia', value: '76%', detail: 'Temporada actual' },
      { label: 'Asistencias', value: '89%', detail: 'Promedio general' },
      { label: 'Objetivos', value: '7/9', detail: 'Metas del periodo' },
    ],
    drivers: [
      { label: 'Seguimiento', value: '81%', tone: 'neutral' },
      { label: 'Planificación', value: '73%', tone: 'warning' },
      { label: 'Alineación', value: '88%', tone: 'good' },
    ],
    insights: [
      'Hay una brecha de seguimiento en objetivos de operación regional.',
      'La preparación del reporte ejecutivo requiere más granulación por equipo.',
      'Observa mejora cuando se revisan indicadores semanales con liderazgo.',
    ],
    trend: [28, 35, 48, 52, 58, 71, 76],
    funnel: [
      { label: 'Plan', percent: 79, color: '#f59e0b' },
      { label: 'Seguimiento', percent: 72, color: '#2563eb' },
      { label: 'Resultado', percent: 68, color: '#14b8a6' },
    ],
  },
];

function Inicio() {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState(projectCards[0].id);

  const selectedProject = useMemo(
    () => projectCards.find((project) => project.id === selectedProjectId) ?? projectCards[0],
    [selectedProjectId],
  );

  const activeProjects = projectCards.filter((project) => project.status === 'Activa').length;
  const reviewProjects = projectCards.filter((project) => project.status === 'En revisión').length;

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Panel general</p>
          <h2>Mis proyectos</h2>
          <p>Selecciona un modelo para abrirlo y continuar con tu análisis.</p>
        </div>
        <div className="dashboard-date">Actualizado hoy</div>
      </div>

      <div className="dashboard-kpis">
        <MetricCard icon={FolderKanban} label="Total de proyectos" value={String(projectCards.length)} accent />
        <MetricCard icon={Sparkles} label="Activos" value={String(activeProjects)} />
        <MetricCard icon={BarChart3} label="En revisión" value={String(reviewProjects)} />
        <MetricCard icon={TrendingUp} label="Indicadores" value="12" />
      </div>

      <div className="project-board">
        <section className="dashboard-card project-panel">
          <div className="card-heading project-heading">
            <div>
              <h3>Modelos disponibles</h3>
              <p>Abre el proyecto que necesites.</p>
            </div>
            <Briefcase size={20} aria-hidden="true" />
          </div>

          <div className="project-grid">
            {projectCards.map((project) => {
              const isSelected = project.id === selectedProject.id;

              return (
                <button
                  key={project.id}
                  type="button"
                  className={`project-card${isSelected ? ' project-card--selected' : ''}`}
                  onClick={() => setSelectedProjectId(project.id)}
                  style={{
                    borderColor: isSelected ? project.accent : '#e2e8f0',
                    boxShadow: isSelected ? `0 18px 36px ${project.accent}22` : '0 8px 20px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <div className="project-card-header">
                    <span className="project-badge" style={{ background: `${project.accent}1A`, color: project.accent }}>
                      {project.category}
                    </span>
                    <span className="project-updated">{project.updated}</span>
                  </div>

                  <h4>{project.name}</h4>
                  <p>{project.summary}</p>

                  <div className="project-card-footer">
                    <span
                      className="status-pill"
                      style={{
                        color: project.status === 'Activa' ? '#16a34a' : project.status === 'En revisión' ? '#d97706' : '#64748b',
                      }}
                    >
                      {project.status}
                    </span>
                    <ArrowRight size={16} color="#2563eb" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="dashboard-card project-preview">
          <div className="card-heading project-heading">
            <div>
              <h3>Proyecto seleccionado</h3>
              <p>Vista resumida.</p>
            </div>
          </div>

          <div
            className="project-summary-card"
            style={{ background: `${selectedProject.accent}12`, borderColor: `${selectedProject.accent}55` }}
          >
            <p className="project-summary-label" style={{ color: selectedProject.accent }}>
              {selectedProject.category}
            </p>
            <h4>{selectedProject.name}</h4>
            <p>{selectedProject.summary}</p>
            <div className="project-summary-meta">
              <span>{selectedProject.status}</span>
              <span>{selectedProject.updated}</span>
            </div>
          </div>

          <div className="project-detail-panel">
            <div className="project-detail-header">
              <div>
                <p className="eyebrow">Detalle del proyecto</p>
                <h4>{selectedProject.name}</h4>
              </div>
              <span className="project-detail-status" style={{ background: `${selectedProject.accent}14`, color: selectedProject.accent }}>
                {selectedProject.status}
              </span>
            </div>

            <div className="project-metric-grid">
              {selectedProject.metrics.map((metric) => (
                <div key={metric.label} className="project-mini-metric">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <small>{metric.detail}</small>
                </div>
              ))}
            </div>

            <div className="project-visual-grid">
              <div className="project-visual-card">
                <div className="project-visual-header">
                  <h5>Tendencia</h5>
                  <span>Últimos 7 días</span>
                </div>
                <div className="project-bars" aria-label="Tendencia del proyecto">
                  {selectedProject.trend.map((value, index) => (
                    <div key={`${selectedProject.id}-bar-${index}`} className="project-bar-group">
                      <span className="project-bar" style={{ height: `${value}%`, background: selectedProject.accent }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="project-visual-card">
                <div className="project-visual-header">
                  <h5>Funnel</h5>
                  <span>Etapas clave</span>
                </div>
                <div className="project-funnel-list">
                  {selectedProject.funnel.map((stage) => (
                    <div key={stage.label} className="project-funnel-item">
                      <div className="project-funnel-label-row">
                        <span>{stage.label}</span>
                        <strong>{stage.percent}%</strong>
                      </div>
                      <div className="project-funnel-track">
                        <span style={{ width: `${stage.percent}%`, background: stage.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="project-detail-section">
              <h5>Indicadores clave</h5>
              <div className="project-driver-list">
                {selectedProject.drivers.map((driver) => (
                  <div key={driver.label} className="project-driver-item">
                    <div className="project-driver-copy">
                      <span>{driver.label}</span>
                      <strong>{driver.value}</strong>
                    </div>
                    <span className={`driver-tone driver-tone-${driver.tone}`} />
                  </div>
                ))}
              </div>
            </div>

          </div>

          <button
            type="button"
            className="btn btn-primary project-open-btn"
            onClick={() => navigate(`/dashboard/proyectos/${selectedProject.id}`)}
          >
            Ver vista del proyecto
          </button>
        </aside>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, accent = false }: { icon: typeof BarChart3; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`metric-card${accent ? ' metric-card-accent' : ''}`}>
      <span><Icon size={16} />{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default Inicio;