"use client";
import { useState, useEffect } from "react";
import { getAllInstitutions, registerInstitution, getAllCredentialsFlat } from "../lib/store";
import { useToast } from "../components/Toast";
import Footer from "../components/Footer";
import type { Institution, VerifiedCredential } from "../lib/store";

const font = "'Courier New', monospace";
const bg = '#0a0a0f';
const card = '#0f0f1a';
const green = '#00ff88';
const blue = '#0066ff';
const border = '#1e1e2e';
const grad = `linear-gradient(135deg, ${green}, ${blue})`;

const KEYFRAMES = `
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,255,136,.4)}70%{box-shadow:0 0 0 10px rgba(0,255,136,0)}}
`;

export default function InstitutionRegistry() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [form, setForm] = useState({ name: '', domain: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [searchPRN, setSearchPRN] = useState('');
  const [searchInst, setSearchInst] = useState('');
  const [searchResults, setSearchResults] = useState<VerifiedCredential[]>([]);
  const [searched, setSearched] = useState(false);
  const [activeSection, setActiveSection] = useState<'register' | 'verify'>('register');
  const { showToast } = useToast();

  useEffect(() => {
    setInstitutions(getAllInstitutions());
  }, []);

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletConnected || !form.name || !form.domain) return;
    setIsRegistering(true);
    // Simulate Solana contract interaction
    await new Promise(r => setTimeout(r, 1500));
    
    const newInst: Institution = {
      wallet: walletAddress,
      name: form.name,
      domain: form.domain,
      isVerified: true,
      registeredAt: new Date().toISOString()
    };
    
    registerInstitution(newInst);
    setInstitutions(getAllInstitutions());
    setForm({ name: '', domain: '' });
    setIsRegistering(false);
    showToast('Institution registered successfully on Solana devnet!', 'success');
  };

  const handleVerifyStudent = () => {
    const allCreds = getAllCredentialsFlat();
    const results = allCreds.filter(c => {
      const matchPRN = searchPRN ? (c.prnNumber || '').toLowerCase().includes(searchPRN.toLowerCase()) : true;
      const matchInst = searchInst ? (c.institution || '').toLowerCase().includes(searchInst.toLowerCase()) : true;
      return matchPRN && matchInst && (searchPRN || searchInst);
    });
    setSearchResults(results);
    setSearched(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: font, color: '#e8e8e8' }}>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: .3, backgroundImage: 'radial-gradient(circle, #1e1e2e 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${border}`, background: 'rgba(10,10,15,.92)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: grad, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: bg }}>V</div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: green }}>VERIDICHAIN</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: '#555', letterSpacing: 1 }}>INSTITUTION REGISTRY</span>
          <button onClick={connectWallet} style={{
            padding: '8px 20px', background: walletConnected ? 'transparent' : grad,
            color: walletConnected ? green : bg, border: walletConnected ? `1px solid ${green}` : 'none',
            borderRadius: 8, cursor: 'pointer', fontFamily: font, fontWeight: 700, fontSize: 11, letterSpacing: 1,
          }}>
            {walletConnected ? `● ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'CONNECT WALLET'}
          </button>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60, animation: 'fadeUp 0.5s ease both' }}>
          <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 16, background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Institution Registry</h1>
          <p style={{ color: '#888', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            The gold standard of credential verification. Registered institutions get a blue verified badge on all credentials they mint, establishing cryptographic proof of authenticity.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 40 }}>
          {/* Left: Register OR Verify toggle */}
          <div>
            {/* section toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button onClick={() => setActiveSection('register')} style={{ flex: 1, padding: '10px', background: activeSection === 'register' ? grad : 'transparent', color: activeSection === 'register' ? bg : '#888', border: activeSection === 'register' ? 'none' : `1px solid ${border}`, borderRadius: 8, cursor: 'pointer', fontFamily: font, fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>REGISTER</button>
              <button onClick={() => setActiveSection('verify')} style={{ flex: 1, padding: '10px', background: activeSection === 'verify' ? `linear-gradient(135deg, ${blue}, ${green})` : 'transparent', color: activeSection === 'verify' ? bg : '#888', border: activeSection === 'verify' ? 'none' : `1px solid ${border}`, borderRadius: 8, cursor: 'pointer', fontFamily: font, fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>VERIFY STUDENT</button>
            </div>

            {/* Register Form */}
            {activeSection === 'register' && (
              <div style={{ background: card, border: `1px solid ${border}`, padding: 32, borderRadius: 16, animation: 'fadeUp 0.4s ease both' }}>
                <h2 style={{ fontSize: 18, margin: '0 0 20px', color: '#fff' }}>Register Institution</h2>
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, color: '#555', marginBottom: 6, letterSpacing: 1 }}>OFFICIAL NAME</label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Stanford University" style={{ width: '100%', padding: '12px', background: bg, border: `1px solid ${border}`, borderRadius: 8, color: '#fff', outline: 'none', fontFamily: font, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, color: '#555', marginBottom: 6, letterSpacing: 1 }}>VERIFIED DOMAIN</label>
                    <input required value={form.domain} onChange={e => setForm({...form, domain: e.target.value})} placeholder="e.g. stanford.edu" style={{ width: '100%', padding: '12px', background: bg, border: `1px solid ${border}`, borderRadius: 8, color: '#fff', outline: 'none', fontFamily: font, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, color: '#555', marginBottom: 6, letterSpacing: 1 }}>SOLANA WALLET</label>
                    <input disabled value={walletConnected ? walletAddress : 'Not connected'} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.02)', border: `1px dashed ${border}`, borderRadius: 8, color: '#555', outline: 'none', fontFamily: font, boxSizing: 'border-box' }} />
                  </div>
                  <button type="submit" disabled={isRegistering || !walletConnected} style={{ background: walletConnected ? grad : '#1e1e2e', color: walletConnected ? bg : '#555', border: 'none', padding: '14px', borderRadius: 8, fontWeight: 900, cursor: walletConnected ? 'pointer' : 'not-allowed', marginTop: 8, letterSpacing: 1, fontFamily: font }}>
                    {isRegistering ? 'REGISTERING...' : walletConnected ? 'REGISTER ON-CHAIN' : 'CONNECT WALLET TO REGISTER'}
                  </button>
                </form>
              </div>
            )}

            {/* Verify Student Form */}
            {activeSection === 'verify' && (
              <div style={{ background: card, border: `1px solid rgba(0,102,255,.3)`, padding: 32, borderRadius: 16, animation: 'fadeUp 0.4s ease both' }}>
                <h2 style={{ fontSize: 18, margin: '0 0 8px', color: '#fff' }}>Verify Student</h2>
                <p style={{ fontSize: 11, color: '#555', marginBottom: 20 }}>Search by PRN/Certificate number or institution name to find and verify student credentials on-chain.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, color: '#555', marginBottom: 6, letterSpacing: 1 }}>INSTITUTION NAME</label>
                    <input value={searchInst} onChange={e => setSearchInst(e.target.value)} placeholder="e.g. SPPU" style={{ width: '100%', padding: '12px', background: bg, border: `1px solid ${border}`, borderRadius: 8, color: '#fff', outline: 'none', fontFamily: font, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, color: '#555', marginBottom: 6, letterSpacing: 1 }}>PRN / CERTIFICATE NUMBER</label>
                    <input value={searchPRN} onChange={e => setSearchPRN(e.target.value)} placeholder="e.g. 2021BCSCA1234" style={{ width: '100%', padding: '12px', background: bg, border: `1px solid ${border}`, borderRadius: 8, color: '#fff', outline: 'none', fontFamily: font, boxSizing: 'border-box' }} />
                  </div>
                  <button onClick={handleVerifyStudent} disabled={!searchPRN && !searchInst} style={{ background: (searchPRN || searchInst) ? `linear-gradient(135deg, ${blue}, ${green})` : '#1e1e2e', color: (searchPRN || searchInst) ? bg : '#555', border: 'none', padding: '14px', borderRadius: 8, fontWeight: 900, cursor: (searchPRN || searchInst) ? 'pointer' : 'not-allowed', letterSpacing: 1, fontFamily: font }}>SEARCH ON-CHAIN</button>
                </div>

                {searched && (
                  <div style={{ marginTop: 20, borderTop: `1px solid ${border}`, paddingTop: 16 }}>
                    {searchResults.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 20 }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>✗</div>
                        <div style={{ fontSize: 12, color: '#ff3c3c' }}>No matching credentials found</div>
                        <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>No student with this PRN/institution was found on-chain.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: 11, color: green, letterSpacing: 1 }}>{searchResults.length} RESULT{searchResults.length > 1 ? 'S' : ''} FOUND</div>
                        {searchResults.map(c => (
                          <div key={c.id} style={{ padding: 16, background: bg, border: `1px solid rgba(0,255,136,.2)`, borderRadius: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{c.candidateName || c.name}</div>
                              <span style={{ fontSize: 10, color: green, background: 'rgba(0,255,136,.1)', padding: '2px 8px', borderRadius: 4 }}>✓ ON-CHAIN</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#888', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                              <span>Institution: <span style={{ color: '#fff' }}>{c.institution}</span></span>
                              <span>Year: <span style={{ color: '#fff' }}>{c.year}</span></span>
                              {c.prnNumber && <span>PRN: <span style={{ color: '#fff' }}>{c.prnNumber}</span></span>}
                            </div>
                            <div style={{ fontSize: 10, color: '#444', marginTop: 6 }}>ID: {c.id} · TX: {c.txHash?.slice(0, 16)}...</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Registry List */}
          <div style={{ animation: 'fadeUp 0.7s ease both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: `1px solid ${border}`, paddingBottom: 16 }}>
              <h2 style={{ fontSize: 16, color: '#fff', margin: 0, letterSpacing: 1 }}>REGISTERED ENTITIES</h2>
              <span style={{ fontSize: 12, color: green }}>{institutions.length} VERIFIED</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {institutions.map((inst, i) => (
                <div key={inst.wallet + i} style={{ padding: 24, background: card, border: `1px solid ${border}`, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <h3 style={{ fontSize: 18, color: '#fff', margin: 0 }}>{inst.name}</h3>
                      {inst.isVerified && (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, background: blue, borderRadius: '50%', color: '#fff', fontSize: 10 }}>✓</span>
                      )}
                    </div>
                    <a href={`https://${inst.domain}`} target="_blank" rel="noreferrer" style={{ color: '#888', fontSize: 13, textDecoration: 'none' }}>{inst.domain}</a>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>WALLET</div>
                    <div style={{ fontSize: 12, color: green, background: 'rgba(0,255,136,0.1)', padding: '4px 10px', borderRadius: 6 }}>
                      {inst.wallet.length > 20 ? `${inst.wallet.slice(0, 6)}...${inst.wallet.slice(-6)}` : inst.wallet}
                    </div>
                  </div>
                </div>
              ))}
              {institutions.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', border: `1px dashed ${border}`, borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: '#555' }}>No institutions registered yet. Be the first!</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
