import { useState, type SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'bigdata_admin_otps';
const ADMIN_EMAIL = 'yunsunrojas4@gmail.com';

function Login() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'usuario' | 'admin'>('usuario');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (role === 'admin') {
      navigate('/admin', { state: { adminEmail: ADMIN_EMAIL } });
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    if (trimmedEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      navigate('/admin', { state: { adminEmail: ADMIN_EMAIL } });
      return;
    }

    setLoading(true);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const records = stored
        ? (JSON.parse(stored) as Array<{
            email: string;
            code: string;
            userId: string;
            createdAt: number;
            approved?: boolean;
            status?: string;
          }>)
        : [];

      let match = records.find(
        (item) => item.email.toLowerCase() === trimmedEmail.toLowerCase()
      );

      // Si no existe, se crea la solicitud OTP para que le llegue/lo apruebe el admin
      if (!match) {
        const newCode = String(Math.floor(100000 + Math.random() * 900000));
        const newUserId = crypto.randomUUID();
        match = {
          userId: newUserId,
          email: trimmedEmail,
          code: newCode,
          createdAt: Date.now(),
          approved: false,
          status: 'pendiente',
        };

        const nextRecords = [match, ...records];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRecords));
      } else {
        // Opcional: si ya existe, genera un nuevo código OTP actualizado para este intento
        const newCode = String(Math.floor(100000 + Math.random() * 900000));
        match.code = newCode;
        match.createdAt = Date.now();
        
        const updatedRecords = records.map((rec) =>
          rec.userId === match?.userId ? match : rec
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
      }

      // Redirige directamente a la vista del OTP pasando el ID y correo
      navigate('/otp', { state: { userId: match.userId, email: match.email } });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar sesión. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page auth-container">
      <div className="auth-card">
        <h2>Acceder</h2>
        <p className="auth-subtitle">
          Ingresa tu correo para solicitar el código OTP al administrador.
        </p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="role" className="form-label">
              Entrar como
            </label>
            <select
              id="role"
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value as 'usuario' | 'admin')}
            >
              <option value="usuario">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {role === 'usuario' && (
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                autoComplete="email"
                required
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Procesando...' : role === 'admin' ? 'Entrar como admin' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </div>
    </section>
  );
}

export default Login;