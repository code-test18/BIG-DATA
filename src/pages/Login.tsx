import { useState, useRef, type SyntheticEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  // 1. Envío de correo
  const handleSendOtp = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    const fakeCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(fakeCode);
    setStep('otp');

    console.log(`%c[SIMULACIÓN OTP] Código enviado a ${email}: ${fakeCode}`, 'color: #00ff00; font-weight: bold; font-size: 14px;');
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
  const handleVerifyOtp = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const enteredOtp = otp.join('');
    if (enteredOtp === generatedOtp) {
      alert('¡Inicio de sesión exitoso!');
      navigate('/dashboard/procesar');
    } else {
      setError('El código ingresado es incorrecto. Revisa la consola (F12).');
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
              Verificar Código
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setStep('email');
                setOtp(Array(6).fill(''));
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