import { useState, useEffect, useRef, type SyntheticEvent, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const RESEND_AVAILABLE_AT_KEY = 'otp_resend_available_at';
const OTP_VALIDITY_SECONDS = 60;
const RESEND_COOLDOWN_SECONDS = 180;
const STORAGE_KEY = 'bigdata_admin_otps';

export default function Otp() {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(OTP_VALIDITY_SECONDS);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const { state } = useLocation();
  const navigate = useNavigate();
  const userId = state?.userId as string | undefined;
  const email = (state?.email as string | undefined) ?? '';

  useEffect(() => {
    const availableAt = Number(localStorage.getItem(RESEND_AVAILABLE_AT_KEY));
    if (!availableAt || availableAt <= Date.now()) {
      localStorage.setItem(RESEND_AVAILABLE_AT_KEY, String(Date.now() + RESEND_COOLDOWN_SECONDS * 1000));
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => (previous > 0 ? previous - 1 : 0));
      setCooldown(() => {
        const resendAvailableAt = Number(localStorage.getItem(RESEND_AVAILABLE_AT_KEY));
        return resendAvailableAt > Date.now() ? Math.ceil((resendAvailableAt - Date.now()) / 1000) : 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m === 0) return `${sec}s`;
    return `${m} min ${sec < 10 ? '0' : ''}${sec}s`;
  };

  const handleChange = (v: string, i: number) => {
    if (!/^\d*$/.test(v)) return;
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n);
    if (v && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent, i: number) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (!userId || !email) return setError('No se encontró la información del usuario.');

    const enteredCode = otp.join('');
    const stored = localStorage.getItem(STORAGE_KEY);
    const codes = stored ? JSON.parse(stored) as Array<{ email: string; code: string; userId: string; createdAt: number; approved?: boolean }> : [];
    const match = codes.find((item) => item.userId === userId && item.email.toLowerCase() === email.toLowerCase());

    if (!match) {
      setError('No existe un código OTP activo para este usuario. Regresa e intenta nuevamente.');
      return;
    }

    if (match.code !== enteredCode) {
      setError('El código OTP ingresado es incorrecto.');
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      // Marcar registro como aprobado al validar el código OTP correcto
      const updatedCodes = codes.map((item) => 
        item.userId === userId ? { ...item, approved: true, status: 'aprobado' } : item
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCodes));

      localStorage.setItem('auth_token', 'local-admin-otp-token');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!userId || !email || loading || cooldown > 0) return;

    const availableAt = Number(localStorage.getItem(RESEND_AVAILABLE_AT_KEY));
    if (availableAt > Date.now()) {
      setCooldown(Math.ceil((availableAt - Date.now()) / 1000));
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const codes = stored ? JSON.parse(stored) as Array<{ email: string; code: string; userId: string; createdAt: number; approved?: boolean }> : [];

      const newCode = String(Math.floor(100000 + Math.random() * 900000));
      const nextCodes = codes.map((item) => 
        item.userId === userId && item.email.toLowerCase() === email.toLowerCase() 
          ? { ...item, code: newCode, createdAt: Date.now(), approved: false, status: 'pendiente' } 
          : item
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCodes));

      setCooldown(RESEND_COOLDOWN_SECONDS);
      localStorage.setItem(RESEND_AVAILABLE_AT_KEY, String(Date.now() + RESEND_COOLDOWN_SECONDS * 1000));
      setTimeLeft(OTP_VALIDITY_SECONDS);
      setOtp(Array(6).fill(''));
      setInfoMessage('Se solicitó un nuevo código al administrador.');
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar nuevo código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page auth-container">
      <div className="auth-card">
        <h2>Verificar código OTP</h2>
        <p className="auth-subtitle">
          Ingresa el código OTP de 6 dígitos que te proporcionará el administrador.
        </p>

        {error && <div className="alert-error">{error}</div>}
        {infoMessage && <div className="alert-success" style={{ marginBottom: '1rem', padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px' }}>{infoMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '20px 0' }}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputsRef.current[idx] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                style={{ width: '40px', height: '48px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            ))}
          </div>

          <div style={{ textAlign: 'center', fontSize: '13px', marginBottom: '15px', color: '#64748b' }}>
            <p>Tiempo de validez: <strong style={{ color: timeLeft < 30 ? '#dc2626' : '#0f172a' }}>{formatTime(timeLeft)}</strong></p>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || otp.some((d) => !d)}>
            {loading ? 'Verificando...' : 'Verificar e ingresar'}
          </button>
        </form>

        <button
          type="button"
          className="btn btn-secondary resend-button"
          onClick={handleResend}
          disabled={loading || cooldown > 0}
          aria-live="polite"
          style={{ marginTop: '10px', width: '100%', opacity: loading || cooldown > 0 ? 0.65 : 1 }}
        >
          {cooldown > 0 ? `Solicitar nuevo código en: ${formatTime(cooldown)}` : 'Solicitar nuevo código'}
        </button>
      </div>
    </section>
  );
}