import { useState, useRef, useEffect, type SyntheticEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; 

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function Login() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  // Cuenta regresiva para el reenvío de código
  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const sendOtp = () => {
    const fakeCode = generateOtp();
    setGeneratedOtp(fakeCode);
    setCooldown(RESEND_COOLDOWN);
    console.log(`%c[SIMULACIÓN OTP] Código enviado a ${email}: ${fakeCode}`, 'color: #00ff00; font-weight: bold; font-size: 14px;');
  };

  const handleSendOtp = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    sendOtp();
    setStep('otp');
  };

  const handleResendOtp = () => {
    if (cooldown > 0) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    setError(null);
    sendOtp();
    inputRefs.current[0]?.focus();
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
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

  const handleVerifyOtp = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (otp.join('') === generatedOtp) {
      navigate('/dashboard/procesar');
    } else {
      setError('El código ingresado es incorrecto. Revisa la consola (F12).');
    }
  };

  const handleChangeEmail = () => {
    setStep('email');
    setOtp(Array(OTP_LENGTH).fill(''));
    setError(null);
    setCooldown(0);
  };

  return (
    <section className="page auth-container">
      <div className="auth-card">
        <h2>Iniciar Sesión</h2>
        <p className="auth-subtitle">
          {step === 'email'
            ? 'Ingresa tu correo para recibir tu código de acceso.'
            : `Ingresa el código enviado a ${email}`}
        </p>

        {error && <div className="alert-error">{error}</div>}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp}>
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
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Enviar código de verificación
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
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

            <button
              type="button"
              className="btn-link"
              onClick={handleResendOtp}
              disabled={cooldown > 0}
            >
              {cooldown > 0 ? `Reenviar código (${cooldown}s)` : 'Reenviar código'}
            </button>

            <button type="submit" className="btn btn-primary">
              Verificar Código
            </button>

            <button type="button" className="btn btn-secondary" onClick={handleChangeEmail}>
              Cambiar correo
            </button>
          </form>
        )}

        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </div>
    </section>
  );
}

export default Login;