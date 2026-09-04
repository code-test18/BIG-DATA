import { useEffect, useMemo, useState } from 'react';

interface PendingOtp {
  userId: string;
  email: string;
  code: string;
  createdAt: number;
  approved?: boolean;
  status?: string;
}

const STORAGE_KEY = 'bigdata_admin_otps';
const ADMIN_EMAIL = 'yunsunrojas4@gmail.com';

const sendOtpToAdminEmail = (otp: string) => {
  const subject = encodeURIComponent('Código OTP de acceso - BigData');
  const body = encodeURIComponent(
    `Hola,\n\nTu código OTP para acceder al panel de BigData es: ${otp}\n\nEste código expira en 60 segundos.\n\nGracias.`
  );

  window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
};

export default function Admin() {
  const [codes, setCodes] = useState<PendingOtp[]>([]);
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadCodes = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setCodes([]);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as PendingOtp[];
      setCodes(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCodes([]);
    }
  };

  useEffect(() => {
    loadCodes();
  }, []);

  const latestCode = useMemo(() => codes[0] ?? null, [codes]);

  const createCode = () => {
    const trimmedEmail = email.trim();
    const targetEmail = trimmedEmail || ADMIN_EMAIL;

    if (!targetEmail || !targetEmail.includes('@')) {
      setFeedback('Ingresa un correo válido.');
      return;
    }

    const normalizedEmail = targetEmail.toLowerCase();
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as PendingOtp[];
    const newUserId = crypto.randomUUID();
    const newCode = String(Math.floor(100000 + Math.random() * 900000));
    const record: PendingOtp = {
      userId: newUserId,
      email: normalizedEmail,
      code: newCode,
      createdAt: Date.now(),
      approved: false,
      status: 'pendiente',
    };

    const nextCodes = [record, ...existing.filter((item) => item.email.toLowerCase() !== normalizedEmail)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCodes));
    sendOtpToAdminEmail(newCode);
    setCodes(nextCodes);
    setFeedback(`Código generado para ${normalizedEmail}. Se envió el OTP a ${ADMIN_EMAIL}.`);
    setEmail('');
  };

  const approveAccess = (userId: string) => {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as PendingOtp[];
    const updated = current.map((item) => item.userId === userId ? { ...item, approved: true, status: 'aprobado' } : item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setCodes(updated);
    setFeedback('El acceso fue aprobado para ese usuario.');
  };

  const deleteEmailRecord = (userId: string) => {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as PendingOtp[];
    const filtered = current.filter((item) => item.userId !== userId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    setCodes(filtered);
    setFeedback('El correo y su código OTP fueron eliminados.');
  };

  return (
    <section className="page auth-container admin-page">
      <div className="auth-card admin-card">
        <div className="admin-header">
          <div>
            <p className="eyebrow">Acceso administrativo</p>
            <h2>Panel de administrador</h2>
          </div>
        </div>
        <p className="auth-subtitle">Genera un código OTP, revisa su estado y aprueba el acceso del usuario.</p>

        <div className="admin-form">
          <div className="form-group">
            <label htmlFor="admin-email" className="form-label">Correo del usuario</label>
            <input
              id="admin-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@correo.com"
            />
          </div>

          <button type="button" className="btn btn-primary" onClick={createCode}>
            Generar código OTP
          </button>
        </div>

        {feedback && <div className="alert-success admin-feedback">{feedback}</div>}

        <div className="admin-section">
          <h3>Código activo</h3>
          {latestCode ? (
            <div className="admin-otp-card">
              <div className="admin-row">
                <span>Correo</span>
                <strong>{latestCode.email}</strong>
              </div>
              <div className="admin-row">
                <span>Código OTP</span>
                <strong className="otp-code">{latestCode.code}</strong>
              </div>
              <div className="admin-row">
                <span>Estado</span>
                <strong className={latestCode.approved ? 'status-approved' : 'status-pending'}>
                  {latestCode.approved ? 'Aprobado' : 'Pendiente'}
                </strong>
              </div>
              <div className="admin-row">
                <span>Generado</span>
                <strong>{new Date(latestCode.createdAt).toLocaleString('es-MX')}</strong>
              </div>
              <div className="admin-actions-row">
                {!latestCode.approved && (
                  <button type="button" className="btn btn-secondary admin-action" onClick={() => approveAccess(latestCode.userId)}>
                    Aprobar acceso
                  </button>
                )}
                <button type="button" className="btn btn-danger admin-action" onClick={() => deleteEmailRecord(latestCode.userId)}>
                  Eliminar correo
                </button>
              </div>
            </div>
          ) : (
            <div className="alert-error">Todavía no hay códigos generados.</div>
          )}
        </div>

        <div className="admin-section">
          <h3>Historial</h3>
          {codes.length === 0 ? (
            <p className="admin-empty">Sin registros.</p>
          ) : (
            <div className="admin-history">
              {codes.map((item) => (
                <div key={item.userId} className="admin-history-item">
                  <div className="history-main">
                    <strong>{item.email}</strong>
                    <div className="history-date">{new Date(item.createdAt).toLocaleString('es-MX')}</div>
                  </div>
                  <div className="history-meta">
                    <span className="history-code">{item.code}</span>
                    <small className={item.approved ? 'status-approved' : 'status-pending'}>
                      {item.approved ? 'Aprobado' : 'Pendiente'}
                    </small>
                    {!item.approved && (
                      <button type="button" className="btn btn-secondary admin-mini-btn" onClick={() => approveAccess(item.userId)}>
                        Aprobar
                      </button>
                    )}
                    <button type="button" className="btn btn-danger admin-mini-btn" onClick={() => deleteEmailRecord(item.userId)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
