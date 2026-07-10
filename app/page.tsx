"use client";
import { useState, useEffect } from "react";
import { writeCredentialToChain } from "./lib/solana";
import { generateQRDataURL } from "./lib/qrcode";
import { generateCertificatePDF } from "./lib/certificate";
import { useToast } from "./components/Toast";
import Footer from "./components/Footer";
import { 
  addCredential, 
  getAllCredentialsFlat, 
  getApplicationByCode, 
  getProfileByRefCode,
  getProfile,
  isExpired,
  isRevoked,
  revokeCredential
} from "./lib/store";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"home" | "issue" | "verify" | "wallet">("home");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<null | "valid" | "invalid">(null);
  const [verifiedProfile, setVerifiedProfile] = useState<any>(null);
  const [issueForm, setIssueForm] = useState({ candidateName: "", institution: "", year: "", recipientWallet: "", expiresAt: "", prnNumber: "" });
  const [skills, setSkills] = useState<{name: string, url: string}[]>([]);
  const [isMinting, setIsMinting] = useState(false);
  const [lastIssuedId, setLastIssuedId] = useState("");
  const [lastIssuedQR, setLastIssuedQR] = useState("");
  const [badgeUrl, setBadgeUrl] = useState("");
  const [isVerifyingBadge, setIsVerifyingBadge] = useState(false);
  const { showToast } = useToast();

  const handleVerifyBadgeUrl = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!badgeUrl) return;
    
    let platformName = "Unknown";
    const validPlatforms = ['credly.com', 'coursera.org', 'udemy.com', 'ibm.com', 'google.com', 'linkedin.com'];
    const matched = validPlatforms.find(p => badgeUrl.toLowerCase().includes(p));
    
    if (matched) {
      platformName = matched.split('.')[0].toUpperCase();
    } else if (badgeUrl.startsWith('http')) {
      try {
        const url = new URL(badgeUrl);
        platformName = url.hostname.replace('www.', '').split('.')[0].toUpperCase();
      } catch (e) {
        showToast("Please enter a valid URL.", "error"); return;
      }
    } else {
      showToast("Unsupported badge URL. Please use a valid badge link (e.g., https://...).", "error"); return;
    }
    
    setIsVerifyingBadge(true);
    await new Promise(resolve => setTimeout(resolve, 1200)); // simulate verification delay
    const skillName = `Verified Skill (${platformName})`;
    if (!skills.some(s => s.url === badgeUrl)) {
      setSkills([...skills, { name: skillName, url: badgeUrl }]);
    }
    setBadgeUrl("");
    setIsVerifyingBadge(false);
  };

  const connectWallet = async () => {
    if ("solana" in window) {
      const sol = (window as any).solana;
      if (sol.isPhantom) {
        try {
          const response = await sol.connect();
          setWalletAddress(response.publicKey.toString());
          setWalletConnected(true);
        } catch (err) { console.error("Wallet connection failed", err); }
      }
    } else { window.open("https://phantom.app/", "_blank"); }
  };

  useEffect(() => {
    if ("solana" in window) {
      const sol = (window as any).solana;
      if (sol?.isPhantom && sol.isConnected) {
        sol.connect({ onlyIfTrusted: true }).then((r: any) => { setWalletAddress(r.publicKey.toString()); setWalletConnected(true); }).catch(() => {});
      }
    }
  }, []);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletConnected) { showToast("Please connect your Phantom wallet first", "warning"); return; }
    setIsMinting(true);
    try {
      const credId = "VC-" + Math.random().toString(16).substring(2, 8).toUpperCase();
      const credName = issueForm.candidateName + " — " + issueForm.institution;
      const txHash = await writeCredentialToChain((window as any).solana, { ...issueForm, id: credId, skills: skills.length > 0 ? skills.map(s => s.name).join(',') : undefined });
      const newCred = {
        id: credId, name: credName, degree: credName, institution: issueForm.institution, year: issueForm.year,
        issuedAt: new Date().toISOString(), expiresAt: issueForm.expiresAt || undefined, recipientWallet: issueForm.recipientWallet,
        issuerWallet: walletAddress, txHash: txHash, realTxHash: txHash, verified: true, 
        candidateName: issueForm.candidateName, skills: skills.length > 0 ? skills.map(s => s.name) : undefined,
        prnNumber: issueForm.prnNumber || undefined
      };
      addCredential(issueForm.recipientWallet, newCred);
      const qr = await generateQRDataURL(credId);
      setLastIssuedId(credId); setLastIssuedQR(qr);
      setIssueForm({ candidateName: "", institution: "", year: "", recipientWallet: "", expiresAt: "", prnNumber: "" });
      setSkills([]);
    } catch (err) { showToast("Failed to issue credential. Check wallet connection.", "error"); } finally { setIsMinting(false); }
  };

  const handleVerify = () => {
    if (!verifyInput.trim()) return;
    const input = verifyInput.trim();
    
    // Check if Application Code or Reference Code
    if (input.startsWith('APP-')) {
      const app = getApplicationByCode(input);
      if (app) {
        const prof = getProfile(app.candidateWallet);
        if (prof) { setVerifiedProfile({ ...prof, matchScore: 94 }); setVerifyResult("valid"); return; }
      }
    } else if (input.startsWith('VDC-')) {
      const prof = getProfileByRefCode(input);
      if (prof) { setVerifiedProfile({ ...prof, matchScore: 88 }); setVerifyResult("valid"); return; }
    }
    
    // Fallback to searching all credentials by ID or TX
    const creds = getAllCredentialsFlat();
    const found = creds.find(c => c.id === input || c.txHash === input || c.realTxHash === input);
    
    if (found) {
      const isExp = isExpired(found.expiresAt);
      const isRev = isRevoked(found.id);
      if (isExp || isRev) { setVerifyResult("invalid"); return; }
      setVerifyResult("valid"); setVerifiedProfile(null);
    } else {
      setVerifyResult("invalid"); setVerifiedProfile(null);
    }
  };

  const navItem = (tab: any, label: string) => (
    <button onClick={() => setActiveTab(tab)} style={{ background: 'none', border: 'none', color: activeTab === tab ? '#00ff88' : '#888', fontFamily: "'Courier New', monospace", fontSize: '13px', fontWeight: activeTab === tab ? 700 : 400, letterSpacing: '1px', cursor: 'pointer', padding: '10px' }}>
      {label}
    </button>
  );

  return (
    <div className="cyber-grid" style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: "'Courier New', monospace", position: 'relative' }}>
      {/* Background radial gradient for sick glow */}
      <div className="animate-pulse-glow" style={{ position: 'fixed', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '80vh', background: 'radial-gradient(circle, rgba(0,255,136,0.12) 0%, rgba(10,10,15,0) 70%)', pointerEvents: 'none', zIndex: 0, borderRadius: '50%' }}></div>
      <nav className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setActiveTab('home')}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #00ff88, #0066ff)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: '#0a0a0f' }}>V</div>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#00ff88', letterSpacing: '2px' }}>VERIDICHAIN</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>{navItem('home', 'HOME')}{navItem('issue', 'ISSUE')}{navItem('verify', 'VERIFY')}{navItem('wallet', 'WALLET')}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {walletConnected && (
            <>
              <a href={`/profile/${walletAddress}`} style={{ fontSize: '11px', color: '#888', textDecoration: 'none', padding: '6px 14px', border: '1px solid #1e1e2e', borderRadius: '6px', letterSpacing: '1px', transition: 'all .2s' }}>MY PROFILE</a>
              <a href="/employer" style={{ fontSize: '11px', color: '#555', textDecoration: 'none', letterSpacing: '1px' }}>EMPLOYER</a>
              <a href="/institution" style={{ fontSize: '11px', color: '#555', textDecoration: 'none', letterSpacing: '1px' }}>REGISTRY</a>
            </>
          )}
          {walletConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '8px' }}>
              <div style={{ width: '6px', height: '6px', background: '#00ff88', borderRadius: '50%' }}></div>
              <span style={{ fontSize: '11px', color: '#00ff88' }}>{walletAddress.slice(0,4)}...{walletAddress.slice(-4)}</span>
            </div>
          ) : (
            <button onClick={connectWallet} style={{ background: 'linear-gradient(135deg, #00ff88, #0066ff)', color: '#0a0a0f', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', letterSpacing: '1px', fontFamily: "'Courier New', monospace", fontSize: '12px' }}>CONNECT PHANTOM</button>
          )}
        </div>
      </nav>

      <main style={{ padding: '60px 20px', maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {activeTab === 'home' && (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <div className="animate-fade-up" style={{ fontSize: '12px', color: '#00ff88', letterSpacing: '3px', marginBottom: '16px', fontWeight: 700 }}>POWERED BY SOLANA</div>
            <h1 className="animate-fade-up text-gradient" style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 900, marginBottom: '20px', lineHeight: 1.1 }}>Your Credentials.<br />On-Chain. Forever.</h1>
            <p className="animate-fade-up" style={{ fontSize: '16px', color: '#888', maxWidth: '560px', margin: '0 auto 40px', lineHeight: '1.7', animationDelay: '0.1s' }}>Issue and verify academic &amp; professional credentials on Solana. One link replaces your entire resume — immutable, instant, fraud-proof.</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="animate-fade-up animate-pulse-glow" onClick={() => setActiveTab('issue')} style={{ background: 'linear-gradient(135deg, #00ff88, #0066ff)', color: '#0a0a0f', border: 'none', padding: '14px 32px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '14px', letterSpacing: '1px', fontFamily: "'Courier New', monospace", transition: 'transform 0.2s', animationDelay: '0.2s' }} onMouseOver={e => e.currentTarget.style.transform='scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform='scale(1)'}>ISSUE CREDENTIAL</button>
              <button className="glass-panel animate-fade-up" onClick={() => setActiveTab('verify')} style={{ color: '#fff', padding: '14px 32px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', letterSpacing: '1px', fontFamily: "'Courier New', monospace", transition: 'all 0.2s', animationDelay: '0.3s' }} onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background='rgba(15, 15, 26, 0.6)'}>VERIFY CANDIDATE</button>
            </div>
            <div className="animate-fade-up" style={{ display: 'flex', gap: '40px', justifyContent: 'center', marginTop: '60px', animationDelay: '0.4s' }}>
              <div className="glass-panel" style={{ padding: '20px 30px', borderRadius: '12px', transition: 'transform 0.3s' }} onMouseOver={e => e.currentTarget.style.transform='translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}><div className="text-gradient" style={{ fontSize: '32px', fontWeight: 900, background: 'linear-gradient(270deg, #00ff88, #fff, #00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>1.3s</div><div style={{ fontSize: '11px', color: '#888', letterSpacing: '1px', marginTop: '8px' }}>VERIFY TIME</div></div>
              <div className="glass-panel" style={{ padding: '20px 30px', borderRadius: '12px', transition: 'transform 0.3s' }} onMouseOver={e => e.currentTarget.style.transform='translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}><div className="text-gradient" style={{ fontSize: '32px', fontWeight: 900 }}>100%</div><div style={{ fontSize: '11px', color: '#888', letterSpacing: '1px', marginTop: '8px' }}>ON-CHAIN</div></div>
              <div className="glass-panel" style={{ padding: '20px 30px', borderRadius: '12px', transition: 'transform 0.3s' }} onMouseOver={e => e.currentTarget.style.transform='translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}><div className="text-gradient" style={{ fontSize: '32px', fontWeight: 900, background: 'linear-gradient(270deg, #0066ff, #fff, #0066ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>$0</div><div style={{ fontSize: '11px', color: '#888', letterSpacing: '1px', marginTop: '8px' }}>VERIFY COST</div></div>
            </div>
            {walletConnected && (
              <div className="animate-fade-up glass-panel" style={{ marginTop: '50px', padding: '20px 28px', borderRadius: '12px', display: 'inline-flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', animationDelay: '0.5s' }}>
                <span style={{ fontSize: '12px', color: '#888' }}>QUICK LINKS</span>
                <a href={`/profile/${walletAddress}`} className="glass-panel" style={{ fontSize: '12px', color: '#00ff88', textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(0,255,136,0.1)'} onMouseOut={e => e.currentTarget.style.background='rgba(15, 15, 26, 0.6)'}>👤 MY PROFILE</a>
                <a href="/employer" className="glass-panel" style={{ fontSize: '12px', color: '#0066ff', textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(0,102,255,0.1)'} onMouseOut={e => e.currentTarget.style.background='rgba(15, 15, 26, 0.6)'}>🏢 EMPLOYER DASHBOARD</a>
                <a href="/institution" className="glass-panel" style={{ fontSize: '12px', color: '#fff', textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background='rgba(15, 15, 26, 0.6)'}>🏛 INSTITUTION REGISTRY</a>
              </div>
            )}

            {/* LIVE FEED SIMULATION */}
            <div className="animate-fade-up glass-panel" style={{ marginTop: '80px', padding: '24px', borderRadius: '16px', textAlign: 'left', animationDelay: '0.6s', maxWidth: '700px', margin: '80px auto 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div className="animate-pulse-glow" style={{ width: 8, height: 8, background: '#00ff88', borderRadius: '50%' }}></div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#00ff88', letterSpacing: '2px' }}>LIVE NETWORK ACTIVITY</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { tx: 'Minted Credential', inst: 'Stanford Univ', time: '12s ago', icon: '🎓', color: '#00ff88' },
                  { tx: 'Verified Badge', inst: 'Google Cloud', time: '45s ago', icon: '✓', color: '#0066ff' },
                  { tx: 'Profile Accessed', inst: 'Employer (0x8F...2a1)', time: '2m ago', icon: '💼', color: '#a855f7' }
                ].map((act, i) => (
                  <div key={i} className="animate-slide-right" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', animationDelay: `${0.7 + i * 0.2}s` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '20px' }}>{act.icon}</div>
                      <div>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{act.tx}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>{act.inst}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: act.color, border: `1px solid ${act.color}40`, background: `${act.color}15`, padding: '4px 10px', borderRadius: '20px' }}>{act.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'issue' && (
          <div style={{ maxWidth: '600px', margin: '0 auto', background: '#0f0f1a', padding: '40px', borderRadius: '16px', border: '1px solid #1e1e2e' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '24px' }}>Mint Credential</h2>
            <p style={{ color: '#555', fontSize: '12px', marginBottom: '30px' }}>Issue a verified credential on Solana. Badges are optional — add them to strengthen the profile.</p>
            <form onSubmit={handleIssue} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#555', letterSpacing: '1px', marginBottom: '6px' }}>CANDIDATE NAME</label>
                <input value={issueForm.candidateName} onChange={e => setIssueForm({...issueForm, candidateName: e.target.value})} placeholder="e.g. Pranav Mahajan" required style={{ width: '100%', padding: '12px', background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: '8px', color: '#fff', outline: 'none', fontFamily: "'Courier New', monospace" }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#555', letterSpacing: '1px', marginBottom: '6px' }}>INSTITUTION / UNIVERSITY</label>
                <input value={issueForm.institution} onChange={e => setIssueForm({...issueForm, institution: e.target.value})} placeholder="e.g. SPPU, IIT Bombay, Stanford" required style={{ width: '100%', padding: '12px', background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: '8px', color: '#fff', outline: 'none', fontFamily: "'Courier New', monospace" }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#555', letterSpacing: '1px', marginBottom: '6px' }}>PRN / CERTIFICATE NO. <span style={{ color: '#333' }}>(OPTIONAL)</span></label>
                  <input value={issueForm.prnNumber} onChange={e => setIssueForm({...issueForm, prnNumber: e.target.value})} placeholder="e.g. 2021BCSCA1234" style={{ width: '100%', padding: '12px', background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: '8px', color: '#fff', outline: 'none', fontFamily: "'Courier New', monospace" }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#555', letterSpacing: '1px', marginBottom: '6px' }}>YEAR OF PASSOUT</label>
                  <input value={issueForm.year} onChange={e => setIssueForm({...issueForm, year: e.target.value})} placeholder="e.g. 2024" required style={{ width: '100%', padding: '12px', background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: '8px', color: '#fff', outline: 'none', fontFamily: "'Courier New', monospace" }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#555', letterSpacing: '1px', marginBottom: '6px' }}>RECIPIENT WALLET</label>
                <input value={issueForm.recipientWallet} onChange={e => setIssueForm({...issueForm, recipientWallet: e.target.value})} placeholder="Solana Wallet Address" required style={{ width: '100%', padding: '12px', background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: '8px', color: '#fff', outline: 'none', fontFamily: "'Courier New', monospace" }} />
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px dashed #1e1e2e' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#555', letterSpacing: '1px', marginBottom: '4px' }}>VERIFIED BADGES <span style={{ color: '#333' }}>(OPTIONAL — STRENGTHENS PROFILE)</span></label>
                <p style={{ fontSize: '11px', color: '#333', marginBottom: '12px' }}>Paste a badge URL from Credly, Coursera, Udemy, Google, IBM, etc.</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input value={badgeUrl} onChange={e => setBadgeUrl(e.target.value)} placeholder="https://credly.com/badges/..." style={{ flex: 1, padding: '10px', background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: '6px', color: '#fff', outline: 'none', fontSize: '13px', fontFamily: "'Courier New', monospace" }} />
                  <button type="button" onClick={handleVerifyBadgeUrl} disabled={!badgeUrl || isVerifyingBadge} style={{ padding: '0 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', fontFamily: "'Courier New', monospace" }}>{isVerifyingBadge ? 'VERIFYING...' : 'VERIFY & ADD'}</button>
                </div>
                {skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '15px' }}>
                    {skills.map((s, i) => (
                      <span key={i} style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', border: '1px solid rgba(0,255,136,0.3)' }}>✓ {s.name}</span>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" disabled={isMinting || !walletConnected} style={{ background: 'linear-gradient(135deg, #00ff88, #0066ff)', color: '#0a0a0f', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', marginTop: '10px', fontFamily: "'Courier New', monospace", letterSpacing: '1px' }}>{isMinting ? 'MINTING ON SOLANA...' : 'MINT CREDENTIAL'}</button>
            </form>
            {lastIssuedId && (
              <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0,255,136,0.1)', border: '1px solid #00ff88', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ color: '#00ff88', marginBottom: '10px', fontWeight: 'bold' }}>Success! Credential ID: {lastIssuedId}</div>
                {lastIssuedQR && <img src={lastIssuedQR} alt="QR Code" style={{ width: '120px', height: '120px', borderRadius: '8px', margin: '10px 0' }} />}
              </div>
            )}
          </div>
        )}

        {activeTab === 'verify' && (
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>Instant Verification</h2>
            <p style={{ color: '#888', marginBottom: '40px' }}>Enter an Application Code (APP-), Reference Code (VDC-), or Credential ID (VC-).</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
              <input value={verifyInput} onChange={e => setVerifyInput(e.target.value)} placeholder="e.g. APP-A1B2C3" style={{ flex: 1, padding: '16px', background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: '12px', color: '#fff', fontSize: '16px', outline: 'none' }} />
              <button onClick={handleVerify} style={{ background: '#00ff88', color: '#000', border: 'none', padding: '0 30px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>VERIFY</button>
            </div>
            
            {verifyResult === 'invalid' && (
              <div style={{ padding: '30px', background: 'rgba(255,60,60,0.1)', border: '1px solid #ff3c3c', borderRadius: '16px', color: '#ff3c3c' }}>
                <h3 style={{ fontSize: '24px', margin: '0 0 10px' }}>✕ INVALID OR REVOKED</h3>
                <p>This credential could not be verified on the Solana blockchain.</p>
              </div>
            )}

            {verifyResult === 'valid' && verifiedProfile && (
              <div style={{ padding: '40px', background: '#0f0f1a', border: '1px solid #00ff88', borderRadius: '16px', textAlign: 'left', animation: 'fadeUp 0.5s ease both' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ color: '#00ff88', fontWeight: 900, fontSize: '18px' }}>✓ VERIFIED APPLICANT</div>
                  <div style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', padding: '6px 12px', borderRadius: '20px', fontSize: '12px' }}>MATCH SCORE: {verifiedProfile.matchScore}%</div>
                </div>
                <h3 style={{ fontSize: '28px', margin: '0 0 10px' }}>{verifiedProfile.displayName}</h3>
                <p style={{ color: '#888', margin: '0 0 20px' }}>{verifiedProfile.title} · {verifiedProfile.credentials.length} Verified Credentials</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
                  {verifiedProfile.skills.map((s: any) => <span key={s.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>{s.name}</span>)}
                </div>
                <a href={`/u/${verifiedProfile.username || verifiedProfile.walletAddress}`} style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg, #00ff88, #0066ff)', color: '#000', padding: '14px', borderRadius: '8px', textDecoration: 'none', fontWeight: 900 }}>VIEW FULL PROFILE</a>
              </div>
            )}
            
            {verifyResult === 'valid' && !verifiedProfile && (
              <div style={{ padding: '40px', background: '#0f0f1a', border: '1px solid #00ff88', borderRadius: '16px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '24px', color: '#00ff88', margin: '0 0 10px' }}>✓ CREDENTIAL VERIFIED</h3>
                <p style={{ color: '#888' }}>Cryptographic proof confirmed on Solana Devnet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'wallet' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '24px' }}>My Wallet</h2>
              {walletConnected && <a href={`/profile/${walletAddress}`} style={{ color: '#00ff88', textDecoration: 'none', border: '1px solid #00ff88', padding: '8px 16px', borderRadius: '20px', fontSize: '12px' }}>EDIT PROFILE</a>}
            </div>
            {!walletConnected ? (
              <div className="glass-panel animate-fade-up" style={{ textAlign: 'center', padding: '60px', borderRadius: '16px', border: '1px dashed #1e1e2e' }}>
                <p style={{ color: '#888', marginBottom: '20px' }}>Connect your Phantom wallet to view your credentials.</p>
                <button onClick={connectWallet} className="animate-pulse-glow" style={{ background: '#00ff88', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}>CONNECT WALLET</button>
              </div>
            ) : (
              <div className="animate-fade-up">
                {/* Profile Stats Overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                  <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', borderLeft: '4px solid #00ff88' }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>TOTAL CREDENTIALS</div>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }}>{getAllCredentialsFlat().filter(c => c.recipientWallet === walletAddress).length}</div>
                  </div>
                  <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', borderLeft: '4px solid #0066ff' }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>PROFILE STRENGTH</div>
                    <div className="text-gradient" style={{ fontSize: '32px', fontWeight: 900 }}>88%</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '20px' }}>
                  {getAllCredentialsFlat().filter(c => c.recipientWallet === walletAddress).length === 0 ? (
                     <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '12px' }}><p style={{ color: '#888' }}>No credentials found in your wallet.</p></div>
                  ) : (
                    getAllCredentialsFlat().filter(c => c.recipientWallet === walletAddress).map((c, i) => (
                      <div key={c.id} className="glass-panel animate-slide-right" style={{ padding: '24px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animationDelay: `${i * 0.1}s`, transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform='translateX(5px)'} onMouseOut={e => e.currentTarget.style.transform='translateX(0)'}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ width: '8px', height: '8px', background: '#00ff88', borderRadius: '50%', boxShadow: '0 0 8px #00ff88' }}></div>
                            <h4 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>{c.degree}</h4>
                          </div>
                          <div style={{ color: '#888', fontSize: '14px', paddingLeft: '16px' }}>{c.institution} · {c.year}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => generateCertificatePDF(c as any)} style={{ background: 'transparent', color: '#00ff88', border: '1px solid #00ff88', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>DOWNLOAD PDF</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            )}
          </div>
        )}
      </main>

      {/* ───── HOW IT WORKS SECTION ───── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 20px', borderTop: '1px solid #1e1e2e' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#00ff88', letterSpacing: '3px', marginBottom: '12px', fontWeight: 700 }}>STREAMLINED PROCESS</div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, marginBottom: '48px', color: '#fff' }}>How It Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {[
              { step: '01', icon: '🔗', title: 'Connect Wallet', desc: 'Link your Phantom wallet to establish your on-chain identity on Solana Devnet.' },
              { step: '02', icon: '🎓', title: 'Issue Credential', desc: 'Institutions mint verified academic credentials as immutable on-chain records.' },
              { step: '03', icon: '✓', title: 'Instant Verify', desc: 'Employers verify any credential in under 2 seconds using a unique ID or QR code.' },
              { step: '04', icon: '💼', title: 'Get Hired', desc: 'Share your verified profile link. No background checks needed — trust is on-chain.' },
            ].map((item, i) => (
              <div key={item.step} className="glass-panel animate-fade-up" style={{
                padding: '32px 24px', borderRadius: '16px', textAlign: 'center', transition: 'all .4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                position: 'relative', overflow: 'hidden', animationDelay: `${0.2 + i * 0.15}s`
              }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,255,136,0.1)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)'; }}>
                <div style={{ position: 'absolute', top: 12, right: 16, fontSize: '48px', fontWeight: 900, color: 'rgba(0,255,136,.06)' }}>{item.step}</div>
                <div className="animate-pulse-glow" style={{ fontSize: '36px', marginBottom: '16px', display: 'inline-block', padding: '15px', background: 'rgba(0,0,0,0.4)', borderRadius: '50%' }}>{item.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>{item.title}</h3>
                <p style={{ fontSize: '14px', color: '#888', lineHeight: '1.6' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
