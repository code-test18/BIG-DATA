import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { crearSolicitud } from '../services/solicitudesService';

const initialForm = {
  nombre: '',
  email: '',
  telefono: '',
  asunto: '',
  mensaje: '',
};

function Home() {
  const [form, setForm] = useState(initialForm);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    crearSolicitud({
      nombre: form.nombre,
      email: form.email,
      telefono: form.telefono,
      asunto: form.asunto,
      mensaje: form.mensaje,
      fuente: 'LANDING',
    });

    setEnviado(true);
    setForm(initialForm);
  };

  return (
    <section className="page container">
      <div className="hero">
        <h2>Transformamos Datos Masivos en Decisiones Estratégicas</h2>
        <p>
          En BigData impulsamos a las organizaciones mediante el procesamiento y análisis de grandes volúmenes de datos en tiempo real.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/servicios" className="btn btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '0.6rem 1.5rem' }}>
            Explorar Servicios
          </Link>
          <Link to="/contacto" className="btn btn-secondary" style={{ display: 'inline-block', width: 'auto', padding: '0.6rem 1.5rem', marginTop: 0 }}>
            Hablar con ventas
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Solicita una asesoría</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input type="text" className="form-input" value={form.nombre} onChange={(event) => setForm((actual) => ({ ...actual, nombre: event.target.value }))} placeholder="Tu nombre" required />
            </div>
            <div className="form-group">
              <label className="form-label">Correo</label>
              <input type="email" className="form-input" value={form.email} onChange={(event) => setForm((actual) => ({ ...actual, email: event.target.value }))} placeholder="correo@ejemplo.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input type="tel" className="form-input" value={form.telefono} onChange={(event) => setForm((actual) => ({ ...actual, telefono: event.target.value }))} placeholder="987 654 321" />
            </div>
            <div className="form-group">
              <label className="form-label">Asunto</label>
              <input type="text" className="form-input" value={form.asunto} onChange={(event) => setForm((actual) => ({ ...actual, asunto: event.target.value }))} placeholder="Necesito una demo" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Mensaje</label>
            <textarea className="form-input" rows={4} value={form.mensaje} onChange={(event) => setForm((actual) => ({ ...actual, mensaje: event.target.value }))} placeholder="Cuéntanos qué necesitas analizar" required style={{ resize: 'vertical' }}></textarea>
          </div>
          {enviado && (
            <div className="alert-success" style={{ marginBottom: '1rem' }}>
              Tu solicitud fue registrada correctamente desde la landing page.
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ maxWidth: '220px' }}>Enviar solicitud</button>
        </form>
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