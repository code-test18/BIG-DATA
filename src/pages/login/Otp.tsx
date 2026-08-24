import { useState, type SyntheticEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

interface OtpResponse {
  token?: string;
  accessToken?: string;
}

function Otp() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId as string | undefined;

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!userId) {
      setError('No se encontró el usuario a verificar.');
      return;
    }

    setLoading(true);
    try {
      const result = (await authService.verifyOtp({ userId, code: code.trim() })) as OtpResponse;
      const token = result?.token ?? result?.accessToken;
      if (!token) throw new Error('No se recibió el token de autenticación.');
      localStorage.setItem('auth_token', token);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo verificar el código.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    if (!userId) {
      setError('No se encontró el usuario a verificar.');
      return;
    }

    setLoading(true);
    try {
      await authService.resendOtp({ userId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reenviar el código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page auth-container">
      <div className="auth-card">
        <h2>Verificar código</h2>
        <p className="auth-subtitle">Ingresa el código enviado a tu correo.</p>
        {error && <div className="alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="otp" className="form-label">Código OTP</label>
            <input
              type="text"
              id="otp"
              className="form-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Verificando...' : 'Verificar código'}
          </button>
        </form>
        <button type="button" className="btn btn-secondary" onClick={handleResend} disabled={loading}>
          Reenviar código
        </button>
      </div>
    </section>
  );
}

export default Otp;