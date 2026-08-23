import { createChallenge, generateOtp } from './otp.js';

type Request = { method?: string; body?: { email?: string } };
type Response = { status: (code: number) => Response; json: (body: unknown) => void };

export default async function handler(request: Request, response: Response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método no permitido.' });

  const email = request.body?.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ error: 'Por favor, ingresa un correo electrónico válido.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    return response.status(500).json({ error: 'El servicio de correo no está configurado.' });
  }

  const otp = generateOtp();
  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Tu código de acceso',
      html: `<p>Tu código de acceso es:</p><p style="font-size: 28px; font-weight: bold; letter-spacing: 8px">${otp}</p><p>Caduca en 10 minutos.</p>`,
    }),
  });

  if (!resendResponse.ok) {
    return response.status(502).json({ error: 'No fue posible enviar el correo. Inténtalo de nuevo.' });
  }

  return response.status(200).json({ challenge: createChallenge(email, otp) });
}