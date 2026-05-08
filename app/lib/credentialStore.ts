// Credential store with expiry & revocation support

const CREDENTIALS_KEY = 'veridichain_issued';
const REVOKED_KEY = 'veridichain_revoked';

export interface StoredCredential {
  id: string;
  name: string;
  degree: string;
  institution: string;
  year: string;
  wallet: string;
  txHash: string;
  realTxHash?: string;
  verified: boolean;
  issuedAt: string;
  expiresAt?: string;
  issuerWallet?: string;
}

export function getStoredCredentials(): StoredCredential[] {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function storeCredential(cred: StoredCredential): void {
  const all = getStoredCredentials();
  all.push(cred);
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(all));
}

export function getRevokedIds(): string[] {
  try {
    const raw = localStorage.getItem(REVOKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function revokeCredential(id: string, issuerWallet: string): boolean {
  // Check if the issuer matches
  const all = getStoredCredentials();
  const cred = all.find(c => c.id === id);
  if (cred && cred.issuerWallet && cred.issuerWallet !== issuerWallet) {
    return false; // not the issuer
  }
  const revoked = getRevokedIds();
  if (!revoked.includes(id)) {
    revoked.push(id);
    localStorage.setItem(REVOKED_KEY, JSON.stringify(revoked));
  }
  return true;
}

export function isRevoked(id: string): boolean {
  return getRevokedIds().includes(id);
}

export function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export function getCredentialStatus(id: string, expiresAt?: string): 'valid' | 'expired' | 'revoked' {
  if (isRevoked(id)) return 'revoked';
  if (isExpired(expiresAt)) return 'expired';
  return 'valid';
}
