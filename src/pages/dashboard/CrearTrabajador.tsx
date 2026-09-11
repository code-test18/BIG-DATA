import { useState, type SyntheticEvent } from 'react';
import { crearTrabajador } from '../../services/authService';
import { getToken } from '../../utils/auth';

function CrearTrabajadorPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creado, setCreado] = useState<{ email: string; passwordInicial: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setCreado(null);

    const token = getToken();
    if (!token) {
      setError('Tu sesión expiró. Vuelve a iniciar sesión.');
      return;
    }

    setLoading(true);
    try {
      const { trabajador } = await crearTrabajador(token, { name, email, password });
      setCreado({ email: trabajador.email, passwordInicial: trabajador.passwordInicial });
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear al trabajador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <h2>Equipo de trabajo</h2>
      <p>Crea una cuenta de Trabajador. Comparte la contraseña inicial por fuera del sistema (WhatsApp, en persona, etc.).</p>

      {error && <div className="alert-error">{error}</div>}
      {creado && (
        <div className="alert-success">
          Cuenta creada para <strong>{creado.email}</strong>. Contraseña inicial: <strong>{creado.passwordInicial}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit} className="dashboard-card">
        <div className="form-group">
          <label htmlFor="name" className="form-label">Nombre</label>
          <input id="name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="email" className="form-label">Correo</label>
          <input id="email" type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="password" className="form-label">Contraseña inicial</label>
          <input id="password" type="text" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creando...' : 'Crear trabajador'}
        </button>
      </form>
    </div>
  );
}

export default CrearTrabajadorPage;