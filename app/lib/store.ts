// VeridiChain Central Store — localStorage-backed, type-safe

export interface VerifiedCredential {
  id: string;
  name: string;         // credential/course name
  degree: string;       // alias for name (legacy compat)
  institution: string;  // issuer
  year: string;
  issuedAt: string;
  expiresAt?: string;
  badgeUrl?: string;    // original badge URL (Credly, Coursera etc)
  platform?: string;    // 'credly' | 'coursera' | 'udemy' | 'google' | 'linkedin'
  recipientWallet: string;
  issuerWallet?: string;
  txHash: string;
  realTxHash?: string;
  verified: boolean;
  revoked?: boolean;
  candidateName?: string;
  skills?: string[];
  prnNumber?: string;  // PRN or certificate number
}

export interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  credentialId?: string;
  endorsements?: number;
  verified?: boolean;    // true = verified via badge URL (blue tick)
  badgeUrl?: string;     // original badge URL proof
}

export interface JobApplication {
  refCode: string;       // VDC-XXXX
  candidateWallet: string;
  company: string;
  role: string;
  createdAt: string;
  status: 'pending' | 'viewed' | 'interested' | 'rejected';
}

export interface Institution {
  wallet: string;
  name: string;
  domain: string;
  isVerified: boolean;
  registeredAt: string;
}

export interface CandidateProfile {
  walletAddress: string;
  username?: string;      // vanity: /u/pranav
  refCode: string;        // VDC-XXXX
  displayName: string;
  bio: string;
  title: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  avatarUrl?: string;
  skills: Skill[];
  credentials: VerifiedCredential[];
  applications: JobApplication[];
  joinedAt: string;
  isPublic: boolean;
}

// ── helpers ──────────────────────────────────────────────
function ls<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function genRefCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'VDC-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── DEMO DATA ─────────────────────────────────────────────
const DEMO_CREDS: VerifiedCredential[] = [
  { id: 'VC-7F3A9B', name: 'B.Tech Computer Science', degree: 'B.Tech Computer Science', institution: 'MIT Pune', year: '2024', issuedAt: '2024-06-15T10:00:00Z', recipientWallet: 'Bg2j6LN7REDvh4qL9zQAijryfCWSFLebFvfJc7pwFm2k', txHash: '5xRt9...Kj2', verified: true },
  { id: 'VC-4D9F2E', name: 'Solana Developer Certification', degree: 'Solana Developer Certification', institution: 'Solana Foundation', year: '2025', issuedAt: '2025-03-10T10:00:00Z', platform: 'credly', badgeUrl: 'https://www.credly.com/badges/solana-dev', recipientWallet: 'Bg2j6LN7REDvh4qL9zQAijryfCWSFLebFvfJc7pwFm2k', txHash: '3kLp7...Qw9', verified: true },
  { id: 'VC-9A1C3F', name: 'AWS Solutions Architect Professional', degree: 'AWS Solutions Architect Professional', institution: 'Amazon Web Services', year: '2024', issuedAt: '2024-09-01T10:00:00Z', platform: 'credly', recipientWallet: 'Bg2j6LN7REDvh4qL9zQAijryfCWSFLebFvfJc7pwFm2k', txHash: '7mQp3...Rn5', verified: true },
];

const DEMO_SKILLS: Skill[] = [
  { id: 's1', name: 'Rust', level: 'advanced' },
  { id: 's2', name: 'TypeScript', level: 'expert' },
  { id: 's3', name: 'Solana/Web3', level: 'advanced' },
  { id: 's4', name: 'React', level: 'expert' },
  { id: 's5', name: 'AWS', level: 'intermediate', credentialId: 'VC-9A1C3F' },
];

// ── PROFILES ──────────────────────────────────────────────
const PROFILES_KEY = 'vc_profiles_v2';

export function getAllProfiles(): Record<string, CandidateProfile> {
  return ls<Record<string, CandidateProfile>>(PROFILES_KEY, {});
}

export function getProfile(wallet: string): CandidateProfile | null {
  const all = getAllProfiles();
  return all[wallet] || null;
}

export function getProfileByUsername(username: string): CandidateProfile | null {
  const all = getAllProfiles();
  return Object.values(all).find(p => p.username?.toLowerCase() === username.toLowerCase()) || null;
}

export function getProfileByRefCode(refCode: string): CandidateProfile | null {
  const all = getAllProfiles();
  return Object.values(all).find(p => p.refCode === refCode) || null;
}

export function saveProfile(profile: CandidateProfile): void {
  const all = getAllProfiles();
  all[profile.walletAddress] = profile;
  lsSet(PROFILES_KEY, all);
}

export function getOrCreateProfile(wallet: string): CandidateProfile {
  let p = getProfile(wallet);
  if (!p) {
    const isDemo = wallet === 'Bg2j6LN7REDvh4qL9zQAijryfCWSFLebFvfJc7pwFm2k';
    p = {
      walletAddress: wallet,
      username: isDemo ? 'pranav' : undefined,
      refCode: genRefCode(),
      displayName: isDemo ? 'Pranav Mahajan' : '',
      bio: isDemo ? 'Blockchain developer building the future of hiring on Solana. Creator of VeridiChain.' : '',
      title: isDemo ? 'Full-Stack Blockchain Developer' : '',
      location: isDemo ? 'Pune, India' : '',
      linkedin: isDemo ? 'pranavmahajan' : '',
      github: isDemo ? 'pranavmahajan' : '',
      skills: isDemo ? DEMO_SKILLS : [],
      credentials: isDemo ? DEMO_CREDS : [],
      applications: [],
      joinedAt: new Date().toISOString(),
      isPublic: true,
    };
    saveProfile(p);
  }
  return p;
}

// ── CREDENTIALS ───────────────────────────────────────────
export function addCredential(wallet: string, cred: VerifiedCredential): void {
  const p = getOrCreateProfile(wallet);
  if (!p.credentials.find(c => c.id === cred.id)) p.credentials.push(cred);
  saveProfile(p);
  // also persist to legacy key for verify page
  const legacy = ls<VerifiedCredential[]>('veridichain_issued', []);
  if (!legacy.find(c => c.id === cred.id)) { legacy.push(cred); lsSet('veridichain_issued', legacy); }
}

export function removeCredential(wallet: string, credId: string): void {
  const p = getProfile(wallet);
  if (!p) return;
  p.credentials = p.credentials.filter(c => c.id !== credId);
  saveProfile(p);
  // also remove from legacy
  const legacy = ls<VerifiedCredential[]>('veridichain_issued', []);
  lsSet('veridichain_issued', legacy.filter(c => c.id !== credId));
}

export function revokeCredential(credId: string, issuerWallet: string): void {
  const all = getAllProfiles();
  for (const p of Object.values(all)) {
    const c = p.credentials.find(c => c.id === credId);
    if (c) { c.revoked = true; saveProfile(p); }
  }
  const revoked = ls<string[]>('vc_revoked', []);
  if (!revoked.includes(credId)) { revoked.push(credId); lsSet('vc_revoked', revoked); }
}

export function isRevoked(id: string): boolean {
  return ls<string[]>('vc_revoked', []).includes(id);
}

export function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export function getAllCredentialsFlat(): VerifiedCredential[] {
  const all = getAllProfiles();
  const creds: VerifiedCredential[] = [];
  const seen = new Set<string>();

  for (const p of Object.values(all)) {
    p.credentials.forEach(c => {
      if (!seen.has(c.id)) { seen.add(c.id); creds.push(c); }
    });
  }
  
  // deduplicate demo
  DEMO_CREDS.forEach(c => { if (!seen.has(c.id)) { seen.add(c.id); creds.unshift(c); }});
  
  const legacy = ls<VerifiedCredential[]>('veridichain_issued', []);
  legacy.forEach(c => { if (!seen.has(c.id)) { seen.add(c.id); creds.push(c); }});
  return creds;
}

// ── JOB APPLICATIONS ──────────────────────────────────────
export function createApplication(wallet: string, company: string, role: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'APP-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  const app: JobApplication = { refCode: code, candidateWallet: wallet, company, role, createdAt: new Date().toISOString(), status: 'pending' };
  const apps = ls<JobApplication[]>('vc_applications', []);
  apps.push(app);
  lsSet('vc_applications', apps);
  // mark on profile
  const p = getOrCreateProfile(wallet);
  p.applications.push(app);
  saveProfile(p);
  return code;
}

export function getApplicationByCode(code: string): JobApplication | null {
  const apps = ls<JobApplication[]>('vc_applications', []);
  return apps.find(a => a.refCode === code) || null;
}

// ── SHORTLISTS ────────────────────────────────────────────
export function getShortlist(recruiterWallet: string): string[] {
  return ls<string[]>(`vc_shortlist_${recruiterWallet}`, []);
}

export function toggleShortlist(recruiterWallet: string, candidateWallet: string): boolean {
  const list = getShortlist(recruiterWallet);
  const idx = list.indexOf(candidateWallet);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(candidateWallet);
  lsSet(`vc_shortlist_${recruiterWallet}`, list);
  return idx < 0;
}

// ── INSTITUTIONS ──────────────────────────────────────────
export function registerInstitution(inst: Institution): void {
  const list = getAllInstitutions();
  if (!list.find(i => i.wallet === inst.wallet)) {
    list.push(inst);
    lsSet('vc_institutions', list);
  }
}

export function getAllInstitutions(): Institution[] {
  const demo: Institution[] = [
    { wallet: 'SolFoundationWallet', name: 'Solana Foundation', domain: 'solana.com', isVerified: true, registeredAt: new Date().toISOString() },
    { wallet: 'MIT_Pune_Wallet', name: 'MIT Pune', domain: 'mitpune.edu.in', isVerified: true, registeredAt: new Date().toISOString() }
  ];
  return ls<Institution[]>('vc_institutions', demo);
}

export function isInstitutionVerified(wallet: string): boolean {
  const all = getAllInstitutions();
  return !!all.find(i => i.wallet === wallet && i.isVerified);
}
