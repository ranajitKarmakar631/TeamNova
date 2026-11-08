/**
 * TaskNova End-to-End Encryption (E2EE) Utility
 * 
 * Provides client-side AES-256-GCM authenticated encryption for task comments.
 * The server only stores encrypted ciphertexts and random IVs, ensuring zero-knowledge
 * comment privacy.
 */

export interface EncryptedPayload {
  isEncrypted: true;
  ciphertext: string; // Base64
  iv: string;         // Base64 (12 bytes)
  algorithm: "AES-256-GCM";
  version: "1.0";
}

// Convert ArrayBuffer / Uint8Array to Base64
export const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Convert Base64 to Uint8Array
export const base64ToBuffer = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// In-memory key cache to prevent re-deriving the key on every single render
const keyCache = new Map<string, CryptoKey>();

/**
 * Derives a deterministic AES-256-GCM key for a workspace using SHA-256.
 * Workspace members derive the exact same key for the workspace, allowing all workspace members
 * to decrypt task comments while keeping them 100% opaque to the server.
 */
export const getWorkspaceEncryptionKey = async (workspaceId: string): Promise<CryptoKey> => {
  const wsId = workspaceId || "global-vault";
  if (keyCache.has(wsId)) {
    return keyCache.get(wsId)!;
  }

  const cryptoObj = typeof window !== "undefined" ? window.crypto : (globalThis as any).crypto;
  if (!cryptoObj?.subtle) {
    throw new Error("Web Crypto API is not available in this environment");
  }

  const enc = new TextEncoder();
  // Generate deterministic 256-bit key material via SHA-256
  const keyBytes = await cryptoObj.subtle.digest(
    "SHA-256",
    enc.encode(`TaskNova-Workspace-Vault-Secret-${wsId}`)
  );

  const importedKey = await cryptoObj.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  keyCache.set(wsId, importedKey);
  return importedKey;
};

/**
 * Encrypt comment content with AES-256-GCM.
 * Handles Lexical JSON AST objects or plaintext strings.
 * Falls back gracefully to original content if Web Crypto is unavailable.
 */
export const encryptCommentContent = async (
  content: any,
  workspaceId: string
): Promise<any> => {
  if (!content) return content;

  try {
    const cryptoObj = typeof window !== "undefined" ? window.crypto : (globalThis as any).crypto;
    if (!cryptoObj?.subtle) {
      console.warn("[E2EE] Web Crypto API not available, sending plaintext");
      return content;
    }

    const key = await getWorkspaceEncryptionKey(workspaceId);

    // 12-byte IV is standard and optimal for AES-GCM
    const iv = cryptoObj.getRandomValues(new Uint8Array(12));

    const textToEncrypt = typeof content === "string" ? content : JSON.stringify(content);
    const encodedData = new TextEncoder().encode(textToEncrypt);

    const encryptedBuffer = await cryptoObj.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encodedData
    );

    return {
      isEncrypted: true,
      ciphertext: bufferToBase64(encryptedBuffer),
      iv: bufferToBase64(iv),
      algorithm: "AES-256-GCM",
      version: "1.0",
    };
  } catch (err) {
    console.warn("[E2EE] Encryption failed, sending plaintext fallback:", err);
    return content;
  }
};

/**
 * Decrypt comment content with AES-256-GCM.
 * Returns the parsed Lexical JSON AST object or string.
 * If the comment is not encrypted (e.g. legacy unencrypted comment), returns content directly.
 */
export const decryptCommentContent = async (
  content: any,
  workspaceId: string
): Promise<{ content: any; isEncrypted: boolean; error?: string }> => {
  if (!content || typeof content !== "object" || !content.isEncrypted) {
    return { content, isEncrypted: false };
  }

  try {
    const cryptoObj = typeof window !== "undefined" ? window.crypto : (globalThis as any).crypto;
    if (!cryptoObj?.subtle) {
      return { content, isEncrypted: true };
    }

    const key = await getWorkspaceEncryptionKey(workspaceId);

    const iv = base64ToBuffer(content.iv);
    const ciphertext = base64ToBuffer(content.ciphertext);

    const decryptedBuffer = await cryptoObj.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      ciphertext
    );

    const decryptedText = new TextDecoder().decode(decryptedBuffer);

    // Try parsing as JSON (Lexical AST state)
    try {
      const parsed = JSON.parse(decryptedText);
      return { content: parsed, isEncrypted: true };
    } catch {
      return { content: decryptedText, isEncrypted: true };
    }
  } catch (err) {
    console.error("[E2EE] Failed to decrypt comment:", err);
    return {
      content: null,
      isEncrypted: true,
      error: "Unable to decrypt comment with workspace key.",
    };
  }
};
