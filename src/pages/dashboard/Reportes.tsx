import { useOutletContext } from 'react-router-dom';
import type { DashboardContextType } from '../../types/csv';

function Reportes() {
  const { analysisResult } = useOutletContext<DashboardContextType>();

  if (!analysisResult) {
    return <div className="dashboard-page"><div className="empty-state"><h2>Aún no hay reportes</h2><p>Configura y procesa un análisis desde la sección Procesar para ver sus resultados aquí.</p></div></div>;
  }

  const maxValue = Math.max(...analysisResult.series.map((item) => item.value), 1);
  return (
    <div className="dashboard-page">
      <div className="report-header"><div><span className="eyebrow">REPORTE GENERADO</span><h2>{analysisResult.title}</h2><p>{analysisResult.sourceFileName} · {analysisResult.processedRows} filas procesadas · {analysisResult.generatedAt}</p></div></div>
      <div className="grid-cards report-metrics">{analysisResult.metrics.map((metric) => <div className="card metric-card" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}</div>
      <section className="report-section"><div className="section-title"><div><span className="eyebrow">DISTRIBUCIÓN</span><h3>Resultados principales</h3></div><span className="result-count">{analysisResult.series.length} elementos</span></div>
        {analysisResult.series.length > 0 ? <div className="chart-list">{analysisResult.series.map((item) => <div className="chart-row" key={item.label}><div className="chart-label"><span>{item.label}</span><strong>{item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></div><div className="chart-track"><span style={{ width: `${Math.max((item.value / maxValue) * 100, 2)}%` }} /></div></div>)}</div> : <p className="report-empty">No hay datos suficientes después de la validación para construir este reporte.</p>}
      </section>
      <section className="report-section report-config"><div className="section-title"><div><span className="eyebrow">CONFIGURACIÓN</span><h3>Origen del análisis</h3></div></div><p>Las métricas fueron calculadas usando las columnas que seleccionaste del CSV real.</p><div className="config-tags">{Object.entries(analysisResult.configuration.columns).map(([role, header]) => <span key={role}>{role}: <strong>{header}</strong></span>)}{analysisResult.configuration.grouping && <span>agrupación: <strong>{analysisResult.configuration.grouping}</strong></span>}</div></section>
    </div>
  );
}

export default Reportes;
