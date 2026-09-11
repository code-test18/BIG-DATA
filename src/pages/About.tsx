function About() {
  return (
    <section className="page container">
      <div className="hero">
        <h2>Sobre Nuestra Plataforma</h2>
        <p>
          Somos una solución tecnológica orientada al procesamiento, ordenamiento y arquitectura analítica para entornos de alto rendimiento.
        </p>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <h3>Nuestra Misión</h3>
          <p>
            Democratizar el acceso a herramientas analíticas complejas mediante interfaces intuitivas y arquitecturas modernas en la nube.
          </p>
        </div>
        <div className="card">
          <h3>Nuestra Visión</h3>
          <p>
            Ser el estándar de consulta y visualización de métricas de procesamiento de datos para estudiantes, empresas e investigadores.
          </p>
        </div>
      </div>
    </section>
  );
}

export default About;