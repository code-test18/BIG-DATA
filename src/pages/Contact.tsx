import { useState, type FormEvent } from 'react';
import { crearSolicitud } from '../services/solicitudesService';

const initialForm = {
  nombreCompleto: '',
  correo: '',
  telefono: '',
  mensaje: '',
};

function Contact() {
  const [form, setForm] = useState(initialForm);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await crearSolicitud({
        nombreCompleto: form.nombreCompleto,
        correo: form.correo,
        telefono: form.telefono,
        mensaje: form.mensaje,
      });

      setEnviado(true);
      setForm(initialForm);
    } catch (err) {
      setEnviado(false);
      setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje.');
    } finally {
      setLoading(false);
    }
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
              <input type="text" className="form-input" placeholder="Tu nombre" value={form.nombreCompleto} onChange={(event) => setForm((actual) => ({ ...actual, nombreCompleto: event.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input type="email" className="form-input" placeholder="correo@ejemplo.com" value={form.correo} onChange={(event) => setForm((actual) => ({ ...actual, correo: event.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input type="tel" className="form-input" placeholder="972 123 456" value={form.telefono} onChange={(event) => setForm((actual) => ({ ...actual, telefono: event.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Mensaje</label>
              <textarea className="form-input" rows={4} placeholder="Escribe tu mensaje..." value={form.mensaje} onChange={(event) => setForm((actual) => ({ ...actual, mensaje: event.target.value }))} required style={{ resize: 'vertical' }}></textarea>
            </div>
            {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            {enviado && (
              <div className="alert-success" style={{ marginBottom: '1rem' }}>
                Tu mensaje fue enviado correctamente. La solicitud quedó registrada para revisión.
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Mensaje'}
            </button>
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