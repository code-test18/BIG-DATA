import { useEffect, useRef, useState, type SyntheticEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { consultarEstadoLoginRequest, login, loginSimulado, resendOtp, verifyOtp } from '../../services/authService';
import { guardarSesion } from '../../utils/auth';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;
const POLL_INTERVAL_MS = 4000;

type Step = 'credentials' | 'esperando' | 'otp' | 'denegado';

function Login() {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [denegadoMensaje, setDenegadoMensaje] = useState('');

  const userIdRef = useRef<string | null>(null);
  const loginRequestIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Detiene el polling si el componente se desmonta a medio camino
  useEffect(() => () => stopPolling(), []);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const handleLogin = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }
    if (!password) {
      setError('Por favor, ingresa tu contraseña.');
      return;
    }

    const usuarioSimulado = loginSimulado(email, password);
    if (usuarioSimulado) {
      guardarSesion(usuarioSimulado.token, usuarioSimulado.user);
      navigate('/dashboard/inicio');
      return;
    }

    setLoading(true);
    try {
      const resultado = await login(email, password);

      if (resultado.tipo === 'otp_enviado') {
        userIdRef.current = resultado.userId;
        setStep('otp');
      } else {
        loginRequestIdRef.current = resultado.loginRequestId;
        userIdRef.current = resultado.userId;
        setStep('esperando');
        iniciarPolling(resultado.loginRequestId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const iniciarPolling = (loginRequestId: string) => {
    stopPolling();
    pollTimerRef.current = setInterval(async () => {
      try {
        const { estado, userId } = await consultarEstadoLoginRequest(loginRequestId, email);

        if (estado === 'PENDIENTE') return;

        stopPolling();

        if (estado === 'ACEPTADA') {
          const approvedUserId = userId ?? userIdRef.current;
          if (!approvedUserId) {
            setDenegadoMensaje('El servidor aprobó el acceso, pero no devolvió el identificador del trabajador.');
            setStep('denegado');
            return;
          }
          userIdRef.current = approvedUserId;
          setStep('otp');
        } else if (estado === 'RECHAZADA') {
          setDenegadoMensaje('El Analista rechazó tu solicitud de acceso.');
          setStep('denegado');
        } else if (estado === 'EXPIRADA') {
          setDenegadoMensaje('Pasaron más de 10 minutos sin respuesta. Intenta iniciar sesión de nuevo.');
          setStep('denegado');
        }
      } catch (err) {
        stopPolling();
        setDenegadoMensaje(err instanceof Error ? err.message : 'No se pudo verificar el estado de tu solicitud.');
        setStep('denegado');
      }
    }, POLL_INTERVAL_MS);
  };

  const handleReintentar = () => {
    stopPolling();
    setStep('credentials');
    setPassword('');
    setOtp(Array(OTP_LENGTH).fill(''));
    setError(null);
    setDenegadoMensaje('');
    userIdRef.current = null;
    loginRequestIdRef.current = null;
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setError(null);
    try {
      await resendOtp(email);
      setCooldown(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reenviar el código.');
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (new RegExp(`^\\d{${OTP_LENGTH}}$`).test(pastedData)) {
      setOtp(pastedData.split(''));
      inputRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!userIdRef.current) {
      setError('Falta información de la sesión. Vuelve a iniciar sesión.');
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await verifyOtp(userIdRef.current, otp.join(''));
      guardarSesion(token, user);
      navigate('/dashboard/inicio');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'El código ingresado es incorrecto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page auth-container">
      <div className="auth-card">
        <h2>Iniciar Sesión</h2>

        {step === 'credentials' && (
          <>
            <p className="auth-subtitle">Ingresa tus credenciales para continuar.</p>
            {error && <div className="alert-error">{error}</div>}
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password" className="form-label">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Verificando...' : 'Iniciar sesión'}
              </button>
            </form>
          </>
        )}

        {step === 'esperando' && (
          <>
            <p className="auth-subtitle">Esperando aprobación del Analista...</p>
            <div className="alert-success">
              Se le avisó al Analista por correo. Esta pantalla se actualizará sola cuando responda.
            </div>
          </>
        )}

        {step === 'denegado' && (
          <>
            <div className="alert-error">{denegadoMensaje}</div>
            <button type="button" className="btn btn-primary" onClick={handleReintentar}>
              Volver a intentar
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="auth-subtitle">Ingresa el código enviado a {email}</p>
            {error && <div className="alert-error">{error}</div>}
            <form onSubmit={handleVerifyOtp}>
              <div className="otp-inputs">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="otp-box"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    required
                  />
                ))}
              </div>

              <button type="button" className="btn-link" onClick={handleResendOtp} disabled={cooldown > 0}>
                {cooldown > 0 ? `Reenviar código (${cooldown}s)` : 'Reenviar código'}
              </button>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>

              <button type="button" className="btn btn-secondary" onClick={handleReintentar}>
                Cambiar correo
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

export default Login;