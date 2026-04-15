/**
 * AES-256-GCM symmetric encryption for OAuth tokens stored in DB.
 * Key must be 32 bytes (hex-encoded 64 chars in ENCRYPTION_KEY env).
 *
 * Format stored: hex(iv):hex(authTag):hex(ciphertext)
 */
const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_BYTES   = 12; // 96-bit IV — recommended for GCM

function getKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(raw, "hex");
}

function encrypt(plaintext) {
  if (!plaintext) return null;
  const iv     = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const enc    = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag    = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

function decrypt(stored) {
  if (!stored) return null;
  const [ivHex, tagHex, encHex] = stored.split(":");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const dec = Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()]);
  return dec.toString("utf8");
}

module.exports = { encrypt, decrypt };
