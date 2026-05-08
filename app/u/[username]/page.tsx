'use client';
import { use, useState, useEffect, useCallback, useRef } from 'react';
import { getProfileByUsername, saveProfile, createApplication, getOrCreateProfile, removeCredential } from '../../lib/store';
import { generateQRDataURL } from '../../lib/qrcode';
import { useToast } from '../../components/Toast';
import Footer from '../../components/Footer';
import type { CandidateProfile, Skill, VerifiedCredential } from '../../lib/store';

/* ───── animation keyframes injected once ───── */
const KEYFRAMES = `
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,255,136,.4)}70%{box-shadow:0 0 0 10px rgba(0,255,136,0)}}
@keyframes glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.3)}}
@keyframes dotBg{0%{background-position:0 0}100%{background-position:40px 40px}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
`;

/* ───── shared inline style helpers ───── */
const font = "'Courier New', monospace";
const bg = '#0a0a0f';
const card = '#0f0f1a';
const green = '#00ff88';
const blue = '#0066ff';
const border = '#1e1e2e';
const grad = `linear-gradient(135deg, ${green}, ${blue})`;

const pillStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 16px', borderRadius: 20, fontSize: 11, fontFamily: font, fontWeight: 700,
  letterSpacing: 1, cursor: 'pointer', transition: 'all .25s',
  background: active ? green : 'rgba(255,255,255,.04)',
  color: active ? bg : '#888', border: `1px solid ${active ? green : border}`,
});

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: card, border: `1px solid ${border}`,
  borderRadius: 8, color: '#e8e8e8', fontFamily: font, fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

const btnStyle = (small = false): React.CSSProperties => ({
  padding: small ? '8px 18px' : '12px 28px', background: grad, color: bg, border: 'none',
  borderRadius: 8, cursor: 'pointer', fontFamily: font, fontWeight: 900,
  fontSize: small ? 11 : 13, letterSpacing: 1, transition: 'all .25s',
});

/* ───── sub-components ───── */

function SkeletonCard() {
  return (
    <div style={{ padding: 28, background: card, borderRadius: 14, border: `1px solid ${border}` }}>
      <div style={{ height: 18, width: '60%', borderRadius: 6, background: 'linear-gradient(90deg,#1a1a2e,#2a2a3e,#1a1a2e)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ height: 14, width: '40%', borderRadius: 6, marginTop: 12, background: 'linear-gradient(90deg,#1a1a2e,#2a2a3e,#1a1a2e)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
      background: 'rgba(0,255,136,.1)', border: `1px solid ${green}`, borderRadius: 20,
      fontSize: 10, color: green, letterSpacing: 1, fontWeight: 700, animation: 'pulse 2s infinite',
    }}>✓ VERIFIED</span>
  );
}

function CredentialCard({ cred, idx, isOwner, onDelete }: { cred: VerifiedCredential; idx: number; isOwner: boolean; onDelete?: () => void }) {
  const [hover, setHover] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrSrc, setQrSrc] = useState('');
  const [pendingDelete, setPendingDelete] = useState(false);

  const handleShowQR = async () => {
    if (!qrSrc) {
      const src = await generateQRDataURL(cred.id);
      setQrSrc(src);
    }
    setShowQR(!showQR);
  };

  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        padding: 28, borderRadius: 14, border: `1px solid ${hover ? green : border}`,
        background: `linear-gradient(135deg, ${card} 0%, rgba(0,255,136,.03) 100%)`,
        animation: `fadeUp .5s ease ${idx * .1}s both`, transition: 'all .3s',
        boxShadow: hover ? `0 0 30px rgba(0,255,136,.08)` : 'none', position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: grad, opacity: .06, borderRadius: '0 14px 0 40px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{cred.degree}</div>
          <div style={{ fontSize: 13, color: '#888' }}>{cred.institution} · {cred.year}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {cred.verified && <VerifiedBadge />}
          {isOwner && onDelete && (
            pendingDelete ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#ff3c3c', letterSpacing: 1 }}>SURE?</span>
                <button onClick={() => { onDelete(); setPendingDelete(false); }} style={{ background: 'rgba(255,60,60,.15)', border: '1px solid rgba(255,60,60,.5)', color: '#ff3c3c', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: font, fontSize: 10, fontWeight: 700 }}>YES</button>
                <button onClick={() => setPendingDelete(false)} style={{ background: 'none', border: `1px solid ${border}`, color: '#555', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: font, fontSize: 10 }}>NO</button>
              </div>
            ) : (
              <button onClick={() => setPendingDelete(true)} style={{ background: 'none', border: '1px solid rgba(255,60,60,.3)', color: '#ff3c3c', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: font, fontSize: 10, letterSpacing: 1 }}>× DELETE</button>
            )
          )}
        </div>
      </div>
      {cred.prnNumber && (
        <div style={{ fontSize: 11, color: '#888', marginBottom: 10, padding: '4px 10px', background: 'rgba(255,255,255,.03)', borderRadius: 6, display: 'inline-block' }}>
          PRN / CERT: <span style={{ color: '#fff' }}>{cred.prnNumber}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 20, fontSize: 11, color: '#555', flexWrap: 'wrap', alignItems: 'center' }}>
        <span>ID: <span style={{ color: green }}>{cred.id}</span></span>
        {cred.realTxHash && (
          <a href={`https://explorer.solana.com/tx/${cred.realTxHash}?cluster=devnet`} target="_blank" rel="noreferrer"
            style={{ color: blue, textDecoration: 'none' }}>View TX ↗</a>
        )}
        <button onClick={handleShowQR} style={{ background: 'none', border: `1px solid ${border}`, color: '#888', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: font, fontSize: 10, letterSpacing: 1, transition: 'all .2s' }}>
          {showQR ? 'HIDE QR' : '📱 QR CODE'}
        </button>
      </div>
      {showQR && qrSrc && (
        <div style={{ marginTop: 16, padding: 16, background: 'rgba(0,0,0,.3)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 16, animation: 'fadeUp .3s ease both', flexWrap: 'wrap' }}>
          <img src={qrSrc} alt="QR Code" width={120} height={120} style={{ borderRadius: 8 }} />
          <div>
            <div style={{ fontSize: 11, color: '#555', letterSpacing: 1, marginBottom: 6 }}>SCAN TO VERIFY</div>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>Anyone can scan this QR code to instantly verify this credential on Solana.</div>
            <a href={`/verify/${cred.id}`} style={{ fontSize: 11, color: blue, textDecoration: 'none', marginTop: 6, display: 'inline-block' }}>Open verify link ↗</a>
          </div>
        </div>
      )}
    </div>
  );
}

function SkillTag({ skill, onRemove, isOwner }: { skill: Skill; onRemove?: () => void; isOwner: boolean }) {
  const lvlColor: Record<string, string> = { beginner: '#888', intermediate: blue, advanced: '#a855f7', expert: green };
  const isVerified = skill.verified || !!skill.credentialId;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px',
      background: isVerified ? 'rgba(0,102,255,.06)' : 'rgba(255,255,255,.03)',
      border: `1px solid ${isVerified ? 'rgba(0,102,255,.3)' : border}`, borderRadius: 10, fontSize: 13,
      color: '#e8e8e8', fontFamily: font, transition: 'all .2s',
    }}>
      {isVerified ? (
        <span style={{ color: blue, fontSize: 12, fontWeight: 700 }} title="Verified via badge URL">✓</span>
      ) : (
        <span style={{ color: lvlColor[skill.level] || '#888', fontSize: 8 }}>●</span>
      )}
      {skill.name}
      <span style={{ fontSize: 10, color: '#555', textTransform: 'uppercase' }}>{skill.level}</span>
      {isVerified && <span style={{ fontSize: 9, color: blue, background: 'rgba(0,102,255,.15)', padding: '1px 6px', borderRadius: 4 }}>VERIFIED</span>}
      {isOwner && onRemove && (
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
      )}
    </div>
  );
}

/* ───── main page ───── */
export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const wallet = username; // used below — overridden by real walletAddress after profile loads
  const { showToast } = useToast();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectedWallet, setConnectedWallet] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', username: '', bio: '', title: '', location: '', website: '', github: '', linkedin: '', avatarUrl: '' });
  const [newSkill, setNewSkill] = useState({ name: '', level: 'intermediate' as Skill['level'] });
  const [activeTab, setActiveTab] = useState<'credentials' | 'skills'>('credentials');
  const [copied, setCopied] = useState(false);

  const [showJobModal, setShowJobModal] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', company: '' });
  const [generatedAppCode, setGeneratedAppCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [badgeUrl, setBadgeUrl] = useState('');
  const [isVerifyingBadge, setIsVerifyingBadge] = useState(false);
  const [skillAddMode, setSkillAddMode] = useState<'none' | 'verified' | 'general'>('none');

  const isOwner = connectedWallet !== '' && connectedWallet === profile?.walletAddress;

  const loadProfile = useCallback(() => {
    // Look up by vanity username
    const p = getProfileByUsername(username) || getOrCreateProfile(username);
    setProfile(p);
    setEditForm({
      displayName: p.displayName || '',
      username: p.username || '',
      bio: p.bio || '',
      title: p.title || '',
      location: p.location || '',
      website: p.website || '',
      github: p.github || '',
      linkedin: p.linkedin || '',
      avatarUrl: p.avatarUrl || ''
    });
    setLoading(false);
  }, [username]);

  useEffect(() => {
    const sol = (window as any).solana;

    // Immediate sync check — Edit button appears without refresh
    if (sol?.isPhantom && sol.publicKey) {
      setConnectedWallet(sol.publicKey.toString());
    } else if (sol?.isPhantom && sol.isConnected) {
      sol.connect({ onlyIfTrusted: true })
        .then((r: any) => setConnectedWallet(r.publicKey.toString()))
        .catch(() => { });
    }

    // Listen for wallet events so button appears without refresh
    const onConnect = () => {
      if (sol?.publicKey) setConnectedWallet(sol.publicKey.toString());
    };
    const onAccountChanged = (pk: any) => {
      if (pk) setConnectedWallet(pk.toString());
      else setConnectedWallet('');
    };
    if (sol) {
      sol.on?.('connect', onConnect);
      sol.on?.('accountChanged', onAccountChanged);
    }

    // small delay for loading effect
    const t = setTimeout(loadProfile, 500);
    return () => {
      clearTimeout(t);
      if (sol) {
        sol.removeListener?.('connect', onConnect);
        sol.removeListener?.('accountChanged', onAccountChanged);
      }
    };
  }, [loadProfile]);

  const handleSaveProfile = () => {
    if (!profile) return;
    const updated = { ...profile, ...editForm };
    saveProfile(updated);
    setProfile(updated);
    setEditMode(false);
    showToast('Profile updated successfully!', 'success');
  };

  const handleAddSkill = () => {
    if (!profile || !newSkill.name.trim()) return;
    const skill: Skill = { id: Date.now().toString(), name: newSkill.name.trim(), level: newSkill.level, endorsements: 0, verified: false };
    const updated = { ...profile, skills: [...profile.skills, skill] };
    saveProfile(updated);
    setProfile(updated);
    setNewSkill({ name: '', level: 'intermediate' });
    setSkillAddMode('none');
  };

  const handleAddVerifiedSkill = async () => {
    if (!profile || !badgeUrl) return;
    let platformName = 'Unknown';
    const platforms = ['credly.com', 'coursera.org', 'udemy.com', 'ibm.com', 'google.com', 'linkedin.com'];
    const matched = platforms.find(p => badgeUrl.toLowerCase().includes(p));
    if (matched) { platformName = matched.split('.')[0].toUpperCase(); }
    else if (badgeUrl.startsWith('http')) {
      try { platformName = new URL(badgeUrl).hostname.replace('www.', '').split('.')[0].toUpperCase(); } catch { return; }
    } else { return; }
    setIsVerifyingBadge(true);
    await new Promise(r => setTimeout(r, 1200));
    const skill: Skill = { id: Date.now().toString(), name: `${platformName} Certified`, level: 'advanced', verified: true, badgeUrl, endorsements: 0 };
    const updated = { ...profile, skills: [...profile.skills, skill] };
    saveProfile(updated);
    setProfile(updated);
    setBadgeUrl('');
    setIsVerifyingBadge(false);
  };

  const handleRemoveSkill = (id: string) => {
    if (!profile) return;
    const updated = { ...profile, skills: profile.skills.filter(s => s.id !== id) };
    saveProfile(updated);
    setProfile(updated);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditForm({ ...editForm, avatarUrl: event.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateJobCode = () => {
    if (!profile || !jobForm.title || !jobForm.company) return;
    const code = createApplication(profile.walletAddress, jobForm.company, jobForm.title);
    const updated = getProfileByUsername(username); // reload to get the new app code
    if (updated) setProfile(updated);
    setGeneratedAppCode(code);
  };

  const copyLink = () => {
    const profileUrl = profile?.username
      ? `${window.location.origin}/u/${profile.username}`
      : window.location.href;
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortWallet = profile ? profile.walletAddress.slice(0, 6) + '...' + profile.walletAddress.slice(-4) : '...';

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: font, color: '#e8e8e8' }}>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      {/* dot background overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: .3, backgroundImage: 'radial-gradient(circle, #1e1e2e 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${border}`, background: 'rgba(10,10,15,.92)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: grad, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: bg }}>V</div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: green }}>VERIDICHAIN</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={copyLink} style={{ ...btnStyle(true), background: copied ? green : 'rgba(255,255,255,.05)', color: copied ? bg : '#888', border: `1px solid ${border}` }}>
            {copied ? '✓ COPIED' : '🔗 SHARE'}
          </button>
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 880, margin: '0 auto', padding: '0 24px 80px' }}>
        {loading ? (
          <div style={{ paddingTop: 60, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        ) : profile && (
          <>
            {/* ───── HERO HEADER ───── */}
            <div style={{
              marginTop: 40, padding: '48px 40px', borderRadius: 20,
              border: `1px solid ${border}`, position: 'relative', overflow: 'hidden',
              background: `linear-gradient(170deg, ${card} 0%, rgba(0,102,255,.05) 50%, rgba(0,255,136,.05) 100%)`,
              animation: 'fadeUp .5s ease both',
            }}>
              {/* decorative gradient blob */}
              <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: grad, opacity: .06, filter: 'blur(60px)' }} />

              <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* avatar */}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 96, height: 96, borderRadius: 20, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, fontWeight: 900, color: bg, flexShrink: 0, boxShadow: `0 0 40px rgba(0,255,136,.15)`, overflow: 'hidden'
                  }}>
                    {editForm.avatarUrl || profile.avatarUrl ? (
                      <img src={editMode ? editForm.avatarUrl : profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (profile.displayName || wallet)[0]?.toUpperCase() || '?'
                    )}
                  </div>
                  {editMode && (
                    <button onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: -10, right: -10, background: card, border: `1px solid ${border}`, color: '#fff', padding: '4px 8px', borderRadius: 10, fontSize: 10, cursor: 'pointer', fontFamily: font }}>
                      📷 EDIT
                    </button>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  {editMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <input value={editForm.displayName} onChange={e => setEditForm({ ...editForm, displayName: e.target.value })} placeholder="Your Name" style={inputStyle} />
                        <input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })} placeholder="Username (e.g. pranav)" style={inputStyle} />
                      </div>
                      <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title (e.g. Blockchain Developer)" style={inputStyle} />
                      <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Write a short bio..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <input value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} placeholder="📍 Location" style={inputStyle} />
                        <input value={editForm.website} onChange={e => setEditForm({ ...editForm, website: e.target.value })} placeholder="🌐 Website" style={inputStyle} />
                        <input value={editForm.github} onChange={e => setEditForm({ ...editForm, github: e.target.value })} placeholder="GitHub username" style={inputStyle} />
                        <input value={editForm.linkedin} onChange={e => setEditForm({ ...editForm, linkedin: e.target.value })} placeholder="LinkedIn username" style={inputStyle} />
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        <button onClick={handleSaveProfile} style={btnStyle(true)}>SAVE</button>
                        <button onClick={() => setEditMode(false)} style={{ ...btnStyle(true), background: 'transparent', color: '#888', border: `1px solid ${border}` }}>CANCEL</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 style={{
                        fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, margin: '0 0 4px',
                        background: profile.displayName ? grad : 'none',
                        color: profile.displayName ? 'transparent' : '#555',
                        WebkitBackgroundClip: profile.displayName ? 'text' : undefined,
                        display: 'flex', alignItems: 'center', gap: 12
                      }}>
                        {profile.displayName || 'Unnamed Candidate'}
                        {profile.username && <span style={{ fontSize: 14, padding: '4px 10px', background: 'rgba(255,255,255,.05)', borderRadius: 20, border: `1px solid ${border}`, color: '#888', letterSpacing: 0, fontWeight: 400, display: 'inline-block', verticalAlign: 'middle', textShadow: 'none' }}>@{profile.username}</span>}
                      </h1>
                      {profile.title && <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>{profile.title}</div>}
                      {profile.bio && <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.7, margin: '8px 0 12px', maxWidth: 500 }}>{profile.bio}</p>}
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#555', alignItems: 'center' }}>
                        {profile.location && <span>📍 {profile.location}</span>}
                        {profile.website && <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" style={{ color: blue, textDecoration: 'none' }}>🌐 Website</a>}
                        {profile.github && <a href={`https://github.com/${profile.github}`} target="_blank" rel="noreferrer" style={{ color: '#888', textDecoration: 'none' }}>GitHub ↗</a>}
                        {!isOwner && (
                          <button onClick={() => setShowJobModal(true)} style={{ ...btnStyle(true), marginLeft: 'auto', background: `linear-gradient(135deg, ${blue}, ${green})` }}>
                            💼 APPLY TO JOB
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* wallet address bar + EDIT PROFILE button */}
              <div style={{ marginTop: 24, padding: '14px 20px', background: 'rgba(0,0,0,.3)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ fontSize: 11, color: '#555', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span>WALLET <span style={{ color: green, marginLeft: 6 }}>{shortWallet}</span></span>
                  {profile.refCode && <span>REF <span style={{ color: '#fff', marginLeft: 6, background: 'rgba(255,255,255,.1)', padding: '2px 8px', borderRadius: 4 }}>{profile.refCode}</span></span>}
                  <span>{profile.credentials.length} credentials · {profile.skills.filter(s => s.verified).length} verified skills · {profile.skills.filter(s => !s.verified).length} general skills</span>
                </div>
                {isOwner && !editMode && (
                  <button onClick={() => setEditMode(true)} style={{ padding: '10px 24px', background: grad, color: bg, border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: font, fontWeight: 900, fontSize: 12, letterSpacing: 1 }}>✏ EDIT PROFILE</button>
                )}
              </div>
            </div>

            {/* ───── TAB NAVIGATION ───── */}
            <div style={{ display: 'flex', gap: 8, marginTop: 32, marginBottom: 24 }}>
              <button onClick={() => setActiveTab('credentials')} style={pillStyle(activeTab === 'credentials')}>
                🏆 Credentials ({profile.credentials.length})
              </button>
              <button onClick={() => setActiveTab('skills')} style={pillStyle(activeTab === 'skills')}>
                ⚡ Skills ({profile.skills.length})
              </button>
            </div>

            {/* ───── CREDENTIALS TAB ───── */}
            {activeTab === 'credentials' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {profile.credentials.length === 0 ? (
                  <div style={{ padding: 60, textAlign: 'center', border: `1px dashed ${border}`, borderRadius: 16 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
                    <div style={{ color: '#555', fontSize: 14 }}>No credentials yet</div>
                  </div>
                ) : (
                  profile.credentials.map((c, i) => <CredentialCard key={c.id} cred={c} idx={i} isOwner={isOwner} onDelete={() => {
                    removeCredential(wallet, c.id);
                    loadProfile();
                  }} />)
                )}
              </div>
            )}

            {activeTab === 'skills' && (
              <div style={{ animation: 'fadeUp .4s ease both' }}>
                {/* Show verified skills first, then general */}
                {profile.skills.filter(s => s.verified).length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: blue, letterSpacing: 1, marginBottom: 10 }}>VERIFIED SKILLS (BADGE PROVEN)</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {profile.skills.filter(s => s.verified).map(s => (
                        <SkillTag key={s.id} skill={s} isOwner={isOwner} onRemove={() => handleRemoveSkill(s.id)} />
                      ))}
                    </div>
                  </div>
                )}
                {profile.skills.filter(s => !s.verified).length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: '#555', letterSpacing: 1, marginBottom: 10 }}>GENERAL SKILLS (SELF-DECLARED)</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {profile.skills.filter(s => !s.verified).map(s => (
                        <SkillTag key={s.id} skill={s} isOwner={isOwner} onRemove={() => handleRemoveSkill(s.id)} />
                      ))}
                    </div>
                  </div>
                )}
                {profile.skills.length === 0 && (
                  <div style={{ padding: 48, textAlign: 'center', width: '100%', border: `1px dashed ${border}`, borderRadius: 16, marginBottom: 20 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
                    <div style={{ color: '#555', fontSize: 14 }}>No skills added yet</div>
                  </div>
                )}

                {/* Add skill buttons */}
                {isOwner && skillAddMode === 'none' && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={() => setSkillAddMode('verified')} style={{ ...btnStyle(true), background: 'rgba(0,102,255,.1)', color: blue, border: `1px solid rgba(0,102,255,.3)` }}>✓ ADD VERIFIED SKILL (BADGE URL)</button>
                    <button onClick={() => setSkillAddMode('general')} style={{ ...btnStyle(true), background: 'transparent', color: '#888', border: `1px solid ${border}` }}>+ ADD GENERAL SKILL</button>
                  </div>
                )}

                {/* Verified skill form — badge URL */}
                {isOwner && skillAddMode === 'verified' && (
                  <div style={{ padding: 20, background: card, border: `1px solid rgba(0,102,255,.3)`, borderRadius: 12, animation: 'fadeUp .3s ease both' }}>
                    <div style={{ fontSize: 11, color: blue, letterSpacing: 1, marginBottom: 12 }}>VERIFY SKILL VIA BADGE URL</div>
                    <p style={{ fontSize: 11, color: '#444', marginBottom: 12 }}>Paste a badge/certificate URL from Credly, Coursera, Udemy, Google, IBM etc. Verified skills get a blue tick.</p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input value={badgeUrl} onChange={e => setBadgeUrl(e.target.value)} placeholder="https://credly.com/badges/..." style={{ ...inputStyle, flex: 1 }} />
                      <button onClick={handleAddVerifiedSkill} disabled={!badgeUrl || isVerifyingBadge} style={{ ...btnStyle(true), background: isVerifyingBadge ? '#1e1e2e' : grad, color: isVerifyingBadge ? '#555' : bg }}>{isVerifyingBadge ? 'VERIFYING...' : 'VERIFY & ADD'}</button>
                      <button onClick={() => { setSkillAddMode('none'); setBadgeUrl(''); }} style={{ ...btnStyle(true), background: 'transparent', color: '#888', border: `1px solid ${border}` }}>✕</button>
                    </div>
                  </div>
                )}

                {/* General skill form — self declared */}
                {isOwner && skillAddMode === 'general' && (
                  <div style={{ padding: 20, background: card, border: `1px solid ${border}`, borderRadius: 12, animation: 'fadeUp .3s ease both' }}>
                    <div style={{ fontSize: 11, color: '#555', letterSpacing: 1, marginBottom: 12 }}>ADD GENERAL SKILL (NO BADGE REQUIRED)</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <label style={{ display: 'block', fontSize: 10, color: '#555', letterSpacing: 1, marginBottom: 6 }}>SKILL NAME</label>
                        <input value={newSkill.name} onChange={e => setNewSkill({ ...newSkill, name: e.target.value })} placeholder="e.g. React, Python, AWS" style={inputStyle} />
                      </div>
                      <div style={{ minWidth: 140 }}>
                        <label style={{ display: 'block', fontSize: 10, color: '#555', letterSpacing: 1, marginBottom: 6 }}>LEVEL</label>
                        <select value={newSkill.level} onChange={e => setNewSkill({ ...newSkill, level: e.target.value as Skill['level'] })} style={{ ...inputStyle, cursor: 'pointer' }}>
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                      <button onClick={handleAddSkill} style={btnStyle(true)}>ADD</button>
                      <button onClick={() => setSkillAddMode('none')} style={{ ...btnStyle(true), background: 'transparent', color: '#888', border: `1px solid ${border}` }}>✕</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ───── VERIFICATION FOOTER ───── */}
            <div style={{
              marginTop: 48, padding: '24px 32px', borderRadius: 14,
              border: `1px solid ${border}`, background: 'rgba(0,255,136,.02)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
              animation: 'fadeUp .6s ease .3s both',
            }}>
              <div>
                <div style={{ fontSize: 12, color: '#555', letterSpacing: 1, marginBottom: 4 }}>VERIFIED ON</div>
                <div style={{ fontSize: 14, color: green, fontWeight: 700 }}>SOLANA DEVNET</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: green, animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 12, color: '#888' }}>All credentials on-chain verifiable</span>
              </div>
            </div>

            {/* ───── JOB APPLY MODAL ───── */}
            {showJobModal && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(10px)', animation: 'fadeUp .3s ease both' }}>
                <div style={{ width: '100%', maxWidth: 440, background: card, border: `1px solid ${border}`, borderRadius: 20, padding: 32, position: 'relative' }}>
                  <button onClick={() => { setShowJobModal(false); setGeneratedAppCode(''); setJobForm({ title: '', company: '' }); }} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 20 }}>✕</button>
                  <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900 }}>Generate Application</h2>
                  <p style={{ color: '#888', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>Generate a one-time verified application code for recruiters to access your full profile instantly.</p>

                  {generatedAppCode ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', animation: 'fadeUp .3s ease both' }}>
                      <div style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>SHARE THIS CODE WITH RECRUITER</div>
                      <div style={{ fontSize: 36, fontWeight: 900, color: green, letterSpacing: 4, background: 'rgba(0,255,136,.05)', padding: '16px 24px', borderRadius: 12, border: `1px dashed ${green}`, marginBottom: 24 }}>{generatedAppCode}</div>
                      <button onClick={() => {
                        navigator.clipboard.writeText(generatedAppCode);
                        showToast('Code copied to clipboard!', 'success');
                      }} style={btnStyle()}>📋 COPY CODE</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: '#555', letterSpacing: 1, marginBottom: 8 }}>JOB TITLE</label>
                        <input value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} placeholder="e.g. Senior Frontend Engineer" style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: '#555', letterSpacing: 1, marginBottom: 8 }}>COMPANY NAME</label>
                        <input value={jobForm.company} onChange={e => setJobForm({ ...jobForm, company: e.target.value })} placeholder="e.g. Acme Corp" style={inputStyle} />
                      </div>
                      <button onClick={handleGenerateJobCode} disabled={!jobForm.title || !jobForm.company} style={{ ...btnStyle(), width: '100%', marginTop: 12, opacity: (!jobForm.title || !jobForm.company) ? 0.5 : 1 }}>GENERATE APPLICATION CODE</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}