import { verifyChallenge } from './otp.js';

type Request = { method?: string; body?: { challenge?: string; otp?: string } };
type Response = { status: (code: number) => Response; json: (body: unknown) => void };

export default function handler(request: Request, response: Response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método no permitido.' });

  const { challenge, otp } = request.body ?? {};
  if (!challenge || !otp || !/^\d{6}$/.test(otp) || !verifyChallenge(challenge, otp)) {
    return response.status(401).json({ error: 'El código ingresado es incorrecto o ya caducó.' });
  }

  return response.status(200).json({ verified: true });
}