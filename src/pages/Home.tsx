import { Link } from 'react-router-dom';

function Home() {
  return (
    <section className="page container">
      <div className="hero">
        <h2>Transformamos Datos Masivos en Decisiones Estratégicas</h2>
        <p>
          En BigData impulsamos a las organizaciones mediante el procesamiento y análisis de grandes volúmenes de datos en tiempo real.
        </p>
        <Link to="/servicios" className="btn btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '0.6rem 1.5rem' }}>
          Explorar Servicios
        </Link>
      </div>

      <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Las 4 Vs del Big Data</h3>
      <div className="grid-cards">
        <div className="card">
          <h3>Volumen</h3>
          <p>Procesamiento eficiente de Terabytes y Petabytes de información generada a cada segundo.</p>
        </div>
        <div className="card">
          <h3>Velocidad</h3>
          <p>Análisis en tiempo real e ingesta continua de flujos masivos de datos empresariales.</p>
        </div>
        <div className="card">
          <h3>Variedad</h3>
          <p>Integración de fuentes estructuradas, semiestructuradas y no estructuradas.</p>
        </div>
        <div className="card">
          <h3>Veracidad</h3>
          <p>Depuración y gobernanza de datos para asegurar métricas confiables en la toma de decisiones.</p>
        </div>
      </div>
    </section>
  );
}

export default Home;