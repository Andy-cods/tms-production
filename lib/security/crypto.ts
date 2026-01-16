import crypto from "crypto";

const ENCRYPTION_PREFIX = "enc_v1";

// Track if warning has been shown to avoid log spam
let encryptionWarningShown = false;

function getEncryptionKey() {
  const key = process.env.PII_ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("PII_ENCRYPTION_KEY is required in production");
    }
    // Show warning once in development
    if (!encryptionWarningShown) {
      console.warn(
        "⚠️  WARNING: PII_ENCRYPTION_KEY not set - sensitive data (phone, telegram) will be stored UNENCRYPTED!\n" +
        "   Generate a key with: openssl rand -base64 32\n" +
        "   Add to .env: PII_ENCRYPTION_KEY=<your-key>"
      );
      encryptionWarningShown = true;
    }
    return null;
  }

  const buffer = Buffer.from(key, "base64");
  if (buffer.length !== 32) {
    throw new Error("PII_ENCRYPTION_KEY must be 32 bytes (base64-encoded)");
  }
  return buffer;
}

export function isEncrypted(value: string) {
  return value.startsWith(`${ENCRYPTION_PREFIX}:`);
}

export function encryptPII(value: string | null | undefined) {
  if (!value) return value;
  if (isEncrypted(value)) return value;

  const key = getEncryptionKey();
  if (!key) return value;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTION_PREFIX,
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptPII(value: string | null | undefined) {
  if (!value) return value;
  if (!isEncrypted(value)) return value;

  const key = getEncryptionKey();
  if (!key) return value;

  const parts = value.split(":");
  if (parts.length !== 4) return value;

  const [, ivB64, tagB64, encryptedB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");

  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return value;
  }
}

