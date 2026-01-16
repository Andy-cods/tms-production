import { generateSecret, generateURI, verifySync } from "otplib";

export function generateTwoFactorSecret(accountLabel: string, issuer: string) {
  const secret = generateSecret();
  const otpauthUrl = generateURI({ secret, label: accountLabel, issuer });
  return { secret, otpauthUrl };
}

export function verifyTwoFactorToken(secret: string, token: string) {
  return verifySync({ token, secret }).valid;
}

