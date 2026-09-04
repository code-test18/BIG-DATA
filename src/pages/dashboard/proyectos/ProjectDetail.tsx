import { ArrowLeft, BarChart3, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface DashboardProject {
  id: string;
  name: string;
  category: string;
  summary: string;
  status: 'Activa' | 'Pendiente' | 'En revisión';
  accent: string;
  metrics: Array<{ label: string; value: string; detail: string }>;
  drivers: Array<{ label: string; value: string; tone: 'good' | 'warning' | 'neutral' }>;
  insights: string[];
  trend: number[];
  funnel: Array<{ label: string; percent: number; color: string }>;
}

const projectCatalog: DashboardProject[] = [
  {
    id: 'ventas',
    name: 'Ventas',
    category: 'Operación',
    summary: 'Seguimiento comercial con métricas de rendimiento, asistencia y actitud del equipo.',
    status: 'Activa',
    accent: '#2563eb',
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
      'La productividad del área aumentó un 12% frente al mes anterior.',
      'Los turnos matutinos concentran la mayor asistencia y mejor actitud.',
      'El cierre de jornada requiere reforzar la revisión de indicadores clave.',
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
    summary: 'Módulo de validación, limpieza y preparación de archivos para análisis.',
    status: 'En revisión',
    accent: '#14b8a6',
    metrics: [
      { label: 'Archivos', value: '148', detail: 'Procesados esta semana' },
      { label: 'Data limpia', value: '94%', detail: 'Sin inconsistencias' },
      { label: 'Tiempo', value: '2.4h', detail: 'Promedio de revisión' },
    ],
    drivers: [
      { label: 'Validación', value: '97%', tone: 'good' },
      { label: 'Errores', value: '6%', tone: 'warning' },
      { label: 'Carga', value: '89%', tone: 'neutral' },
    ],
    insights: [
      'Se redujo el número de errores por formato y codificación.',
      'El flujo de limpieza mejora la velocidad operativa semanal.',
      'Falta reforzar validación de columnas en ventas regionales.',
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
    summary: 'Análisis estratégico y segmentación para impulsar crecimiento y retención.',
    status: 'Activa',
    accent: '#8b5cf6',
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
      'La segmentación por perfiles mejora el rendimiento de campañas.',
      'Las actitudes positivas se relacionan con mayor retención del cliente.',
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
    summary: 'Control ejecutivo con revisión de metas, asistencia y avance general.',
    status: 'Pendiente',
    accent: '#f59e0b',
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
      'Existe una brecha de seguimiento en objetivos de operación regional.',
      'La preparación del reporte ejecutivo requiere más detalle por equipo.',
      'Se mejora cuando se revisan indicadores semanales con liderazgo.',
    ],
    trend: [28, 35, 48, 52, 58, 71, 76],
    funnel: [
      { label: 'Plan', percent: 79, color: '#f59e0b' },
      { label: 'Seguimiento', percent: 72, color: '#2563eb' },
      { label: 'Resultado', percent: 68, color: '#14b8a6' },
    ],
  },
];

function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const project = useMemo(
    () => projectCatalog.find((item) => item.id === projectId) ?? projectCatalog[0],
    [projectId],
  );

  return (
    <div className="project-detail-view">
      <div className="project-detail-topbar">
        <button type="button" className="btn btn-secondary project-back-btn" onClick={() => navigate('/dashboard/inicio')}>
          <ArrowLeft size={16} /> Volver a proyectos
        </button>
      </div>

      <div className="project-detail-header-panel" style={{ borderColor: `${project.accent}44` }}>
        <div>
          <p className="eyebrow">{project.category}</p>
          <h2>{project.name}</h2>
          <p className="project-detail-summary">{project.summary}</p>
        </div>
        <span className="project-detail-badge" style={{ background: `${project.accent}14`, color: project.accent }}>
          {project.status}
        </span>
      </div>

      <div className="project-detail-metrics">
        {project.metrics.map((metric) => (
          <div key={metric.label} className="project-detail-metric-card">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </div>
        ))}
      </div>

      <div className="project-detail-grid">
        <div className="project-detail-panel-card">
          <div className="project-panel-title-row">
            <h3>Tendencia</h3>
            <span>Últimos 7 días</span>
          </div>
          <div className="project-detail-bars">
            {project.trend.map((value, index) => (
              <div key={`${project.id}-trend-${index}`} className="project-detail-bar-group">
                <span className="project-detail-bar" style={{ height: `${value}%`, background: project.accent }} />
              </div>
            ))}
          </div>
        </div>

        <div className="project-detail-panel-card">
          <div className="project-panel-title-row">
            <h3>Funnel</h3>
            <span>Etapas clave</span>
          </div>
          <div className="project-detail-funnel">
            {project.funnel.map((stage) => (
              <div key={stage.label} className="project-detail-funnel-item">
                <div className="project-detail-funnel-head">
                  <span>{stage.label}</span>
                  <strong>{stage.percent}%</strong>
                </div>
                <div className="project-detail-funnel-track">
                  <span style={{ width: `${stage.percent}%`, background: stage.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="project-detail-grid">
        <div className="project-detail-panel-card">
          <div className="project-panel-title-row">
            <h3>Indicadores clave</h3>
            <BarChart3 size={18} />
          </div>
          <div className="project-detail-driver-list">
            {project.drivers.map((driver) => (
              <div key={driver.label} className="project-detail-driver-item">
                <div>
                  <span>{driver.label}</span>
                  <strong>{driver.value}</strong>
                </div>
                <span className={`driver-tone driver-tone-${driver.tone}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="project-detail-panel-card">
          <div className="project-panel-title-row">
            <h3>Asistencias y actitudes</h3>
            <Sparkles size={18} />
          </div>
          <ul className="project-insight-list project-detail-insight-list">
            {project.insights.map((insight) => (
              <li key={insight}>{insight}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="project-detail-footer-actions">
        <button type="button" className="btn btn-primary" onClick={() => navigate(`/dashboard/${project.id}`)}>
          Abrir módulo del proyecto
        </button>
      </div>
    </div>
  );
}

export default ProjectDetail;
