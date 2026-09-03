import { useState, useEffect, useRef, type SyntheticEvent, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

const RESEND_AVAILABLE_AT_KEY = 'otp_resend_available_at';
const OTP_VALIDITY_SECONDS = 60;
const RESEND_COOLDOWN_SECONDS = 180;

export default function Otp() {
  // --- ESTADOS ---
  const [otp, setOtp] = useState<string[]>(Array(6).fill('')); // Arreglo para los 6 dígitos del OTP
  const [error, setError] = useState<string | null>(null);     // Mensaje de error para la alerta
  const [loading, setLoading] = useState(false);               // Estado de carga para deshabilitar botones
  const [timeLeft, setTimeLeft] = useState(OTP_VALIDITY_SECONDS); // Tiempo de validez del código (1 minuto)
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [infoMessage, setInfoMessage] = useState<string | null>(null); // Mensaje de éxito/información

  // Referencia para manipular el foco táctil de cada input dinámicamente
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const { state } = useLocation();
  const navigate = useNavigate();
  const userId = state?.userId as string | undefined;

  // --- TEMPORIZADOR GLOBAL (REVERSA / CUENTA REGRESIVA) ---
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

  // Convierte segundos a formato "X min Ys" o "MM:SS"
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m === 0) return `${sec}s`;
    return `${m} min ${sec < 10 ? '0' : ''}${sec}s`;
  };

  // --- MANEJO DE TECLADO Y CASILLAS ---
  const handleChange = (v: string, i: number) => {
    if (!/^\d*$/.test(v)) return;
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n);
    if (v && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent, i: number) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  // --- ACCIONES CON BACKEND ---
  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (!userId) return setError('No se encontró el usuario.');
    setLoading(true);
    setError(null);
    setInfoMessage(null);
    
    try {
      const res = await authService.verifyOtp({ userId, code: otp.join('') }) as { token?: string; accessToken?: string };
      const token = res?.token ?? res?.accessToken;
      if (!token) throw new Error('Token no recibido.');
      
      localStorage.setItem('auth_token', token);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar.');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (!userId || loading || cooldown > 0) return;

    const availableAt = Number(localStorage.getItem(RESEND_AVAILABLE_AT_KEY));
    if (availableAt > Date.now()) {
      setCooldown(Math.ceil((availableAt - Date.now()) / 1000));
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      await authService.resendOtp({ userId });
      setCooldown(RESEND_COOLDOWN_SECONDS);  // Bloquea el botón por 3 minutos
      localStorage.setItem(RESEND_AVAILABLE_AT_KEY, String(Date.now() + RESEND_COOLDOWN_SECONDS * 1000));
      setTimeLeft(OTP_VALIDITY_SECONDS);  // Reinicia el minuto de validez del OTP
      setOtp(Array(6).fill(''));
      setInfoMessage('Nuevo código enviado a tu correo.');
      inputsRef.current[0]?.focus();
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Error al reenviar.';
      
      const match = msg.match(/(\d+)\s*segundos/i);
      if (match && match[1]) {
        const cappedSeconds = Math.min(parseInt(match[1], 10), RESEND_COOLDOWN_SECONDS);
        setCooldown(cappedSeconds); // Se activa el contador dinámico de reversa
        setError(null);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page auth-container">
      <div className="auth-card">
        <h2>Verificar código</h2>
        <p className="auth-subtitle">Ingresa el código OTP enviado a tu correo.</p>

        {/* Alertas */}
        {error && <div className="alert-error">{error}</div>}
        {infoMessage && <div className="alert-success" style={{ marginBottom: '1rem', padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px' }}>{infoMessage}</div>}

        <form onSubmit={handleSubmit}>
          {/* Casillas de OTP */}
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

          {/* Único indicador de validez del código */}
          <div style={{ textAlign: 'center', fontSize: '13px', marginBottom: '15px', color: '#64748b' }}>
            <p>Tiempo de validez: <strong style={{ color: timeLeft < 30 ? '#dc2626' : '#0f172a' }}>{formatTime(timeLeft)}</strong></p>
          </div>

          {/* Botón principal */}
          <button type="submit" className="btn btn-primary" disabled={loading || otp.some((d) => !d)}>
            {loading ? 'Verificando...' : 'Verificar código'}
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
          {cooldown > 0 ? `Reenviar código en: ${formatTime(cooldown)}` : 'Reenviar código'}
        </button>
      </div>
    </section>
  );
}