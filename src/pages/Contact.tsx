import { type SyntheticEvent } from 'react';

function Contact() {
  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert('Mensaje enviado correctamente. Nos pondremos en contacto contigo.');
  };

  return (
    <section className="page container">
      <h2>Ponte en Contacto</h2>
      <p style={{ color: '#64748b' }}>¿Tienes alguna consulta sobre nuestros servicios o proyectos de Big Data?</p>

      <div className="contact-grid">
        <div className="card">
          <h3>Envíanos un mensaje</h3>
          <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nombre Completo</label>
              <input type="text" className="form-input" placeholder="Tu nombre" required />
            </div>
            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input type="email" className="form-input" placeholder="correo@ejemplo.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Mensaje</label>
              <textarea className="form-input" rows={4} placeholder="Escribe tu mensaje..." required style={{ resize: 'vertical' }}></textarea>
            </div>
            <button type="submit" className="btn btn-primary">Enviar Mensaje</button>
          </form>
        </div>

        <div className="card" style={{ height: 'fit-content' }}>
          <h3>Información de Contacto</h3>
          <p style={{ marginBottom: '1rem' }}>
            <strong>Dirección:</strong> Av. Principal de Tecnología 456, Lima, Perú.
          </p>
          <p style={{ marginBottom: '1rem' }}>
            <strong>Correo:</strong> contacto@bigdata-project.com
          </p>
          <p style={{ marginBottom: '1rem' }}>
            <strong>Horario:</strong> Lunes a Viernes: 8:00 AM - 6:00 PM
          </p>
        </div>
      </div>
    </section>
  );
}

export default Contact;