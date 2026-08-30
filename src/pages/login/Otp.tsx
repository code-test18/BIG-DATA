import { useState, useEffect, useRef, type SyntheticEvent, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

export default function Otp() {
  // --- ESTADOS ---
  const [otp, setOtp] = useState<string[]>(Array(6).fill('')); // Arreglo para los 6 dígitos del OTP
  const [error, setError] = useState<string | null>(null);     // Mensaje de error para la alerta
  const [loading, setLoading] = useState(false);               // Estado de carga para deshabilitar botones
  const [timeLeft, setTimeLeft] = useState(180);               // Tiempo de validez del código (3 minutos)
  const [cooldown, setCooldown] = useState(0);                  // Tiempo de bloqueo para reenviar (máx. 5 min)

  // Referencia para manipular el foco táctil de cada input dinámicamente
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const { state } = useLocation();
  const navigate = useNavigate();
  const userId = state?.userId as string | undefined;

  // --- TEMPORIZADOR GLOBAL ---
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((p) => (p > 0 ? p - 1 : 0));
      setCooldown((p) => (p > 0 ? p - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Convierte segundos a formato "X min Ys"
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
    setLoading(true);
    setError(null);

    try {
      await authService.resendOtp({ userId });
      setCooldown(300);  // Bloquea el botón por 5 minutos
      setTimeLeft(180);  // Reinicia los 3 minutos de validez del OTP
      setOtp(Array(6).fill(''));
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Error al reenviar.';
      
      const match = msg.match(/(\d+)\s*segundos/i);
      if (match && match[1]) {
        const cappedSeconds = Math.min(parseInt(match[1], 10), 300);
        setCooldown(cappedSeconds); // Se activa el contador dinámico
        setError(null);             // Limpiamos el error en texto porque el botón ya indicará la espera
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const isResendDisabled = loading || cooldown > 0;

  return (
    <section className="page auth-container">
      <div className="auth-card">
        <h2>Verificar código</h2>
        <p className="auth-subtitle">Ingresa el código OTP enviado a tu correo.</p>

        {/* Solo mostramos la alerta de error si no hay un contador de espera activo */}
        {error && cooldown === 0 && <div className="alert-error">{error}</div>}

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
          <div style={{ textAlign: 'center', fontSize: '13px', marginBottom: '15px' }}>
            <p>Tiempo restante: <strong>{formatTime(timeLeft)}</strong></p>
          </div>

          {/* Botón principal */}
          <button type="submit" className="btn btn-primary" disabled={loading || otp.some((d) => !d)}>
            {loading ? 'Verificando...' : 'Verificar código'}
          </button>
        </form>

        {/* Botón de reenvío */}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleResend}
          disabled={isResendDisabled}
          style={{ marginTop: '10px', width: '100%', opacity: isResendDisabled ? 0.6 : 1 }}
        >
          {cooldown > 0 ? `Reenviar disponible en: ${formatTime(cooldown)}` : 'Reenviar código'}
        </button>
      </div>
    </section>
  );
}