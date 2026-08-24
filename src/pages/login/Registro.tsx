import { useState, type SyntheticEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface FormData {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const initialForm: FormData = {
  nombre: '',
  email: '',
  password: '',
  confirmPassword: '',
};

function Registro() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!form.nombre.trim()) {
      setError('Por favor, ingresa tu nombre.');
      return;
    }

    if (!form.email.trim() || !form.email.includes('@')) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    // Aquí iría la llamada real al backend para crear la cuenta
    console.log('%c[SIMULACIÓN REGISTRO] Cuenta creada:', 'color: #00ff00; font-weight: bold;', form);
    navigate('/login');
  };

  return (
    <section className="page auth-container">
      <div className="auth-card">
        <h2>Crear Cuenta</h2>
        <p className="auth-subtitle">Completa tus datos para registrarte.</p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nombre" className="form-label">
              Nombre
            </label>
            <input
              type="text"
              id="nombre"
              className="form-input"
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Tu nombre completo"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="ejemplo@correo.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="form-input"
              value={form.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Repite tu contraseña"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Crear cuenta
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </section>
  );
}

export default Registro;