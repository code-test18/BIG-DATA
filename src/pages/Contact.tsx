import { type ChangeEvent, type SyntheticEvent, useState } from 'react';
import { sendContactMessage } from '../services/contactService';

interface ContactFormState {
  name: string;
  email: string;
  message: string;
}

const initialForm: ContactFormState = {
  name: '',
  email: '',
  message: '',
};

function Contact() {
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      };

      await sendContactMessage(payload);
      setForm(initialForm);
      setStatus({ type: 'success', message: 'Mensaje enviado correctamente. Nos pondremos en contacto contigo.' });
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo enviar el mensaje.' });
    } finally {
      setIsSubmitting(false);
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
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="form-input"
                placeholder="Tu nombre"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="form-input"
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mensaje</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                className="form-input"
                rows={4}
                placeholder="Escribe tu mensaje..."
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            {status && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: status.type === 'success' ? '#dcfce7' : '#fee2e2',
                  color: status.type === 'success' ? '#166534' : '#991b1b',
                  border: `1px solid ${status.type === 'success' ? '#86efac' : '#fca5a5'}`,
                }}
              >
                {status.message}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
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