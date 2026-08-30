import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

const OTP_EXPIRY_MS = 10 * 60 * 1000;

type OtpPayload = { email: string; otpHash: string; expiresAt: number };

const getSecret = () => {
  const secret = process.env.OTP_SESSION_SECRET;
  if (!secret) throw new Error('OTP_SESSION_SECRET no está configurado.');
  return secret;
};

const encode = (value: string) => Buffer.from(value).toString('base64url');
const decode = (value: string) => Buffer.from(value, 'base64url').toString('utf8');

const sign = (value: string) => createHmac('sha256', getSecret()).update(value).digest('base64url');

export const createChallenge = (email: string, otp: string) => {
  const payload: OtpPayload = {
    email,
    otpHash: sign(`otp:${email}:${otp}`),
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  };
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
};

export const verifyChallenge = (challenge: string, otp: string) => {
  const [encodedPayload, signature] = challenge.split('.');
  if (!encodedPayload || !signature) return false;

  const expectedSignature = sign(encodedPayload);
  if (signature.length !== expectedSignature.length) return false;
  const signaturesMatch = timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
  if (!signaturesMatch) return false;

  let payload: OtpPayload;
  try {
    payload = JSON.parse(decode(encodedPayload)) as OtpPayload;
  } catch {
    return false;
  }

  if (!payload.email || !payload.otpHash || !Number.isFinite(payload.expiresAt)) return false;
  const expectedOtpHash = sign(`otp:${payload.email}:${otp}`);
  if (payload.otpHash.length !== expectedOtpHash.length) return false;

  return payload.expiresAt > Date.now() && timingSafeEqual(
    Buffer.from(payload.otpHash),
    Buffer.from(expectedOtpHash),
  );
};

export const generateOtp = () => randomInt(100000, 1000000).toString();