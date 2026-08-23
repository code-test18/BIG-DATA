import { useState, useRef, type SyntheticEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const emptyOtp = () => Array(6).fill('');

function Login() {
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string[]>(emptyOtp);
  const [challenge, setChallenge] = useState<string | null>(null);

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  // 1. Solicitud de envío del código al servidor
  const handleSendOtp = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await response.json()) as { challenge?: string; error?: string };

      if (!response.ok || !data.challenge) {
        throw new Error(data.error ?? 'No fue posible enviar el código.');
      }

      setChallenge(data.challenge);
      setOtp(emptyOtp());
      setStep('otp');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible enviar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Control de cada casilla de texto
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // 3. Control de borrado (Backspace)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // 4. Control de pegado
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    if (/^\d{6}$/.test(pastedData)) {
      setOtp(pastedData.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  // 5. Validación del código OTP
  const handleVerifyOtp = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge, otp: otp.join('') }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? 'El código ingresado es incorrecto.');
      }

      navigate('/dashboard/procesar');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible verificar el código.');
    } finally {
      setIsLoading(false);
    }
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
              {isLoading ? 'Enviando...' : 'Enviar código de verificación'}
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

            <button type="submit" className="btn btn-primary">
              {isLoading ? 'Verificando...' : 'Verificar Código'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setStep('email');
                setOtp(emptyOtp());
                setChallenge(null);
                setError(null);
              }}
            >
              Cambiar correo
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default Login;