/**
 * Encryption Key Rotation System
 * Enterprise-grade key management with version support
 *
 * Features:
 * - Multiple key versions for rotation
 * - Automatic decryption with correct key version
 * - Re-encryption support for key rotation
 * - Audit logging for key operations
 */

import crypto from "crypto";
import { securityLogger, SecurityEventType, SecurityEventSeverity } from "./security-logger";

const ENCRYPTION_PREFIX = "enc";
const CURRENT_VERSION = 2; // Increment when rotating keys

interface EncryptionKey {
  version: number;
  key: Buffer;
  createdAt: Date;
  expiresAt?: Date;
}

interface EncryptedData {
  version: number;
  iv: string;
  tag: string;
  data: string;
}

// Key store - in production, use HSM or secure key management service
class KeyManager {
  private static instance: KeyManager;
  private keys: Map<number, EncryptionKey> = new Map();
  private currentVersion: number = CURRENT_VERSION;

  private constructor() {
    this.loadKeys();
  }

  public static getInstance(): KeyManager {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager();
    }
    return KeyManager.instance;
  }

  private loadKeys(): void {
    // Load current key
    const currentKey = process.env.PII_ENCRYPTION_KEY;
    if (currentKey) {
      try {
        const buffer = Buffer.from(currentKey, "base64");
        if (buffer.length === 32) {
          this.keys.set(CURRENT_VERSION, {
            version: CURRENT_VERSION,
            key: buffer,
            createdAt: new Date(),
          });
        }
      } catch (error) {
        console.error("[KeyManager] Failed to load current encryption key");
      }
    }

    // Load previous key versions for decryption (during rotation period)
    const previousKey = process.env.PII_ENCRYPTION_KEY_V1;
    if (previousKey) {
      try {
        const buffer = Buffer.from(previousKey, "base64");
        if (buffer.length === 32) {
          this.keys.set(1, {
            version: 1,
            key: buffer,
            createdAt: new Date("2024-01-01"), // Historical
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Keep for 30 days
          });
        }
      } catch (error) {
        console.error("[KeyManager] Failed to load v1 encryption key");
      }
    }

    // Log key status
    if (this.keys.size === 0 && process.env.NODE_ENV === "production") {
      throw new Error("No encryption keys configured for production");
    }
  }

  public getCurrentKey(): EncryptionKey | null {
    return this.keys.get(this.currentVersion) || null;
  }

  public getKey(version: number): EncryptionKey | null {
    const key = this.keys.get(version);
    if (key?.expiresAt && key.expiresAt < new Date()) {
      console.warn(`[KeyManager] Key version ${version} has expired`);
      return null;
    }
    return key || null;
  }

  public getCurrentVersion(): number {
    return this.currentVersion;
  }

  public hasKey(version: number): boolean {
    return this.keys.has(version);
  }

  public getActiveKeyVersions(): number[] {
    return Array.from(this.keys.keys()).filter((v) => {
      const key = this.keys.get(v);
      return key && (!key.expiresAt || key.expiresAt > new Date());
    });
  }
}

// Export singleton
export const keyManager = KeyManager.getInstance();

/**
 * Check if a value is encrypted
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith(`${ENCRYPTION_PREFIX}_v`);
}

/**
 * Parse encrypted string to get version and components
 */
function parseEncrypted(value: string): EncryptedData | null {
  if (!isEncrypted(value)) return null;

  // Format: enc_v{version}:{iv}:{tag}:{data}
  const match = value.match(/^enc_v(\d+):([^:]+):([^:]+):(.+)$/);
  if (!match) {
    // Legacy format: enc_v1:{iv}:{tag}:{data}
    const legacyParts = value.split(":");
    if (legacyParts.length === 4 && legacyParts[0].startsWith("enc_v")) {
      const version = parseInt(legacyParts[0].replace("enc_v", ""), 10) || 1;
      return {
        version,
        iv: legacyParts[1],
        tag: legacyParts[2],
        data: legacyParts[3],
      };
    }
    return null;
  }

  return {
    version: parseInt(match[1], 10),
    iv: match[2],
    tag: match[3],
    data: match[4],
  };
}

/**
 * Encrypt a value with the current key version
 */
export function encrypt(value: string | null | undefined): string | null | undefined {
  if (!value) return value;
  if (isEncrypted(value)) return value;

  const keyData = keyManager.getCurrentKey();
  if (!keyData) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Encryption key not available");
    }
    console.warn("[Encryption] No key available - storing unencrypted");
    return value;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyData.key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    `${ENCRYPTION_PREFIX}_v${keyData.version}`,
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/**
 * Decrypt a value, automatically detecting the key version
 */
export function decrypt(value: string | null | undefined): string | null | undefined {
  if (!value) return value;
  if (!isEncrypted(value)) return value;

  const parsed = parseEncrypted(value);
  if (!parsed) {
    console.warn("[Decryption] Failed to parse encrypted value");
    return value;
  }

  const keyData = keyManager.getKey(parsed.version);
  if (!keyData) {
    console.error(`[Decryption] Key version ${parsed.version} not available`);
    return value;
  }

  try {
    const iv = Buffer.from(parsed.iv, "base64");
    const tag = Buffer.from(parsed.tag, "base64");
    const encrypted = Buffer.from(parsed.data, "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", keyData.key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("[Decryption] Failed to decrypt:", error);
    return value;
  }
}

/**
 * Re-encrypt a value with the current key version
 * Use this during key rotation to update old encrypted values
 */
export async function reEncrypt(
  value: string | null | undefined,
  context?: { userId?: string; resource?: string }
): Promise<string | null | undefined> {
  if (!value) return value;
  if (!isEncrypted(value)) return encrypt(value);

  const parsed = parseEncrypted(value);
  if (!parsed) return value;

  // Already using current version
  if (parsed.version === keyManager.getCurrentVersion()) {
    return value;
  }

  // Decrypt with old key, encrypt with new key
  const decrypted = decrypt(value);
  if (decrypted === value) {
    // Decryption failed
    return value;
  }

  const reEncrypted = encrypt(decrypted);

  // Log the re-encryption event
  await securityLogger.log({
    type: SecurityEventType.SYSTEM_ENCRYPTION_KEY_ROTATED,
    severity: SecurityEventSeverity.INFO,
    userId: context?.userId,
    resource: context?.resource,
    outcome: "SUCCESS",
    details: {
      oldVersion: parsed.version,
      newVersion: keyManager.getCurrentVersion(),
    },
  });

  return reEncrypted;
}

/**
 * Check if a value needs re-encryption
 */
export function needsReEncryption(value: string): boolean {
  if (!isEncrypted(value)) return false;

  const parsed = parseEncrypted(value);
  if (!parsed) return false;

  return parsed.version !== keyManager.getCurrentVersion();
}

/**
 * Get encryption status for monitoring
 */
export function getEncryptionStatus(): {
  currentVersion: number;
  activeVersions: number[];
  hasCurrentKey: boolean;
} {
  return {
    currentVersion: keyManager.getCurrentVersion(),
    activeVersions: keyManager.getActiveKeyVersions(),
    hasCurrentKey: keyManager.getCurrentKey() !== null,
  };
}

// Re-export for backward compatibility with existing code
export { encrypt as encryptPII, decrypt as decryptPII };
