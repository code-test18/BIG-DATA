function Services() {
  return (
    <section className="page container">
      <h2>Servicios Analíticos</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        Soluciones integrales diseñadas para extraer el máximo valor de tus fuentes de datos.
      </p>

      <div className="grid-cards">
        <div className="card">
          <h3>Análisis Predictivo</h3>
          <p>Modelos estadísticos para anticipar tendencias de mercado y comportamiento de usuarios.</p>
        </div>
        <div className="card">
          <h3>Pipelines de Ingesta</h3>
          <p>Construcción y optimización de flujos ETL/ELT automáticos y resilientes.</p>
        </div>
        <div className="card">
          <h3>Data Lakes & Governance</h3>
          <p>Estructuración de repositorios seguros con normativas de acceso y calidad de datos.</p>
        </div>
        <div className="card">
          <h3>Dashboards en Tiempo Real</h3>
          <p>Visualizaciones interactivas para monitoreo continuo de KPIs operativos.</p>
        </div>
      </div>
    </section>
  );
}

export default Services;