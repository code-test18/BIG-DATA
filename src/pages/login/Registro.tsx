import { useState, type SyntheticEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';

interface RegisterResponse {
  userId?: string;
  id?: string;
  user?: { id?: string };
}

export default function Registro() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getPasswordStrength = (pass: string) => {
    if (pass.length < 8) return { label: 'Incompleta', color: 'text-gray-400', percent: 0 };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score === 1) return { label: 'Débil', color: '#ef4444', percent: 33 };
    if (score === 2) return { label: 'Segura', color: '#eab308', percent: 66 };
    return { label: 'Muy segura', color: '#22c55e', percent: 100 };
  };

  const strength = getPasswordStrength(form.password);
  const isMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const result = (await authService.register({
        name: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
      })) as RegisterResponse;

      const userId = result?.userId ?? result?.user?.id ?? result?.id;
      if (!userId) throw new Error('No se recibió el identificador del usuario.');

      navigate('/otp', { state: { userId } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page auth-container">
      <div className="auth-card">
        <h2>Crear Cuenta</h2>
        <p className="auth-subtitle">Completa tus datos para registrarte.</p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nombre" className="form-label">Nombre</label>
            <input
              type="text"
              id="nombre"
              className="form-input"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Tu nombre completo"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ejemplo@correo.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Contraseña (Mín. 8 caracteres)</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
              minLength={8}
            />

            {form.password.length > 0 && (
              <div style={{ marginTop: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span>Nivel:</span>
                  <span style={{ color: strength.color, fontWeight: 'bold' }}>{strength.label}</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: '#e5e7eb', borderRadius: '2px', marginTop: '4px' }}>
                  <div style={{ width: `${strength.percent}%`, height: '100%', background: strength.color, transition: '0.3s' }} />
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-input"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="••••••••"
              required
            />

            {form.confirmPassword.length > 0 && (
              <p style={{ fontSize: '12px', marginTop: '4px', color: isMatch ? '#22c55e' : '#ef4444' }}>
                {isMatch ? '✓ Las contraseñas coinciden' : '✕ Las contraseñas no coinciden'}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || !isMatch}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </section>
  );
}