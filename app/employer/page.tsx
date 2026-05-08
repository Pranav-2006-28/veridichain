'use client';
import { useState, useEffect } from 'react';
import { generateQRDataURL } from '../lib/qrcode';
import { getAllCredentialsFlat, getProfile } from '../lib/store';
import { useToast } from '../components/Toast';
import Footer from '../components/Footer';

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
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes spin{to{transform:rotate(360deg)}}
`;

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '14px 16px', background: card, border: `1px solid ${border}`,
  borderRadius: 8, color: '#e8e8e8', fontFamily: font, fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

function getAllCredentials() {
  return getAllCredentialsFlat();
}

export default function EmployerDashboard() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'wallet' | 'skill' | 'name'>('name');
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [bulkIds, setBulkIds] = useState('');
  const [bulkResults, setBulkResults] = useState<any[]>([]);
  const [bulkVerifying, setBulkVerifying] = useState(false);
  const [activeSection, setActiveSection] = useState<'search' | 'bulk'>('search');
  const { showToast } = useToast();

  const connectWallet = async () => {
    try {
      const { solana } = window as any;
      if (!solana?.isPhantom) { showToast('Please install Phantom wallet!', 'warning'); return; }
      const resp = await solana.connect();
      setWalletConnected(true);
      setWalletAddress(resp.publicKey.toString());
    } catch (err) { console.error(err); }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const all = getAllCredentials();
    const q = searchQuery.trim().toLowerCase();
    let filtered: any[];
    if (searchType === 'wallet') {
      filtered = all.filter(c => c.recipientWallet.toLowerCase().includes(q));
    } else if (searchType === 'name') {
      filtered = all.filter(c => c.name.toLowerCase().includes(q));
    } else {
      // searchType === 'skill': search through the skills array on each credential
      filtered = all.filter(c =>
        (c.skills || []).some((s: string) => s.toLowerCase().includes(q)) ||
        c.degree.toLowerCase().includes(q)
      );
    }
    setResults(filtered);
    setSearched(true);
  };

  const handleBulkVerify = async () => {
    if (!bulkIds.trim()) return;
    setBulkVerifying(true);
    const ids = bulkIds.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const all = getAllCredentials();
    // simulate network delay
    await new Promise(r => setTimeout(r, 1500));
    const res = ids.map(id => {
      const found = all.find(c => c.id === id);
      return { id, found: !!found, credential: found || null };
    });
    setBulkResults(res);
    setBulkVerifying(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: font, color: '#e8e8e8' }}>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: .3, backgroundImage: 'radial-gradient(circle, #1e1e2e 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${border}`, background: 'rgba(10,10,15,.92)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: grad, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: bg }}>V</div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: green }}>VERIDICHAIN</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: '#555', letterSpacing: 1 }}>EMPLOYER PORTAL</span>
          <button onClick={connectWallet} style={{
            padding: '8px 20px', background: walletConnected ? 'transparent' : grad,
            color: walletConnected ? green : bg, border: walletConnected ? `1px solid ${green}` : 'none',
            borderRadius: 8, cursor: 'pointer', fontFamily: font, fontWeight: 700, fontSize: 11, letterSpacing: 1,
          }}>
            {walletConnected ? `● ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'CONNECT'}
          </button>
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* header */}
        <div style={{ marginBottom: 40, animation: 'fadeUp .5s ease both' }}>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, margin: '0 0 8px', background: grad, WebkitBackgroundClip: 'text', color: 'transparent' }}>
            Employer Dashboard
          </h1>
          <p style={{ fontSize: 14, color: '#888', maxWidth: 500 }}>Search candidates, verify credentials in bulk, and view full profiles — all verified on Solana.</p>
        </div>

        {/* section tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {(['search', 'bulk'] as const).map(s => (
            <button key={s} onClick={() => setActiveSection(s)} style={{
              padding: '8px 20px', borderRadius: 20, fontSize: 11, fontFamily: font, fontWeight: 700,
              letterSpacing: 1, cursor: 'pointer', transition: 'all .25s',
              background: activeSection === s ? green : 'rgba(255,255,255,.04)',
              color: activeSection === s ? bg : '#888', border: `1px solid ${activeSection === s ? green : border}`,
            }}>
              {s === 'search' ? '🔍 SEARCH CANDIDATES' : '✓ BULK VERIFY'}
            </button>
          ))}
        </div>

        {/* ───── SEARCH SECTION ───── */}
        {activeSection === 'search' && (
          <div style={{ animation: 'fadeUp .4s ease both' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {(['name', 'wallet', 'skill'] as const).map(t => (
                <button key={t} onClick={() => setSearchType(t)} style={{
                  padding: '6px 14px', fontSize: 10, borderRadius: 6, fontFamily: font, fontWeight: 700,
                  letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase',
                  background: searchType === t ? 'rgba(0,255,136,.1)' : 'transparent',
                  color: searchType === t ? green : '#555', border: `1px solid ${searchType === t ? 'rgba(0,255,136,.3)' : border}`,
                  transition: 'all .2s',
                }}>
                  {t === 'name' ? '👤 NAME' : t === 'wallet' ? '💳 WALLET' : '⚡ SKILL'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
              <input
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={searchType === 'wallet' ? 'Paste wallet address...' : searchType === 'name' ? 'Search by candidate name...' : 'Search by skill or degree...'}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={handleSearch} style={{
                padding: '14px 28px', background: grad, color: bg, border: 'none', borderRadius: 8,
                cursor: 'pointer', fontFamily: font, fontWeight: 900, fontSize: 13, letterSpacing: 1, whiteSpace: 'nowrap',
              }}>SEARCH</button>
            </div>

            {searched && (
              <div>
                <div style={{ fontSize: 11, color: '#555', letterSpacing: 1, marginBottom: 16 }}>
                  {results.length} RESULT{results.length !== 1 ? 'S' : ''} FOUND
                </div>
                {results.length === 0 ? (
                  <div style={{ padding: 48, textAlign: 'center', border: `1px dashed ${border}`, borderRadius: 16 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                    <div style={{ color: '#555', fontSize: 14 }}>No credentials match your search</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {results.map((c, i) => (
                      <div key={c.id + i} style={{
                        padding: 24, borderRadius: 12, border: `1px solid ${border}`,
                        background: `linear-gradient(135deg, ${card}, rgba(0,255,136,.02))`,
                        animation: `fadeUp .4s ease ${i * .08}s both`, transition: 'all .3s',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{c.name}</div>
                            <div style={{ fontSize: 14, color: '#888' }}>{c.degree} · {c.institution}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ padding: '3px 10px', background: 'rgba(0,255,136,.1)', border: `1px solid ${green}`, borderRadius: 20, fontSize: 10, color: green, letterSpacing: 1, fontWeight: 700 }}>✓ VERIFIED</span>
                            <a href={`/profile/${c.recipientWallet}`} style={{ padding: '4px 12px', background: 'rgba(255,255,255,.05)', border: `1px solid ${border}`, borderRadius: 6, fontSize: 10, color: '#888', textDecoration: 'none', fontFamily: font, letterSpacing: 1 }}>VIEW PROFILE →</a>
                          </div>
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 11, color: '#444' }}>
                          <span>ID: <span style={{ color: green }}>{c.id}</span></span>
                          <span>Year: {c.year}</span>
                          <a href={`/verify/${c.id}`} style={{ color: blue, textDecoration: 'none' }}>Verify ↗</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ───── BULK VERIFY SECTION ───── */}
        {activeSection === 'bulk' && (
          <div style={{ animation: 'fadeUp .4s ease both' }}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#555', letterSpacing: 1, marginBottom: 8 }}>PASTE CREDENTIAL IDS (ONE PER LINE OR COMMA-SEPARATED)</label>
              <textarea
                value={bulkIds} onChange={e => setBulkIds(e.target.value)}
                placeholder={"VC-7F3A9B\nVC-2C8E1D\nVC-4D9F2E"}
                rows={5}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <button onClick={handleBulkVerify} disabled={bulkVerifying} style={{
              padding: '14px 32px', background: bulkVerifying ? '#1e1e2e' : grad,
              color: bulkVerifying ? '#555' : bg, border: 'none', borderRadius: 8,
              cursor: bulkVerifying ? 'not-allowed' : 'pointer', fontFamily: font, fontWeight: 900,
              fontSize: 13, letterSpacing: 1, marginBottom: 32,
            }}>
              {bulkVerifying ? 'VERIFYING ON SOLANA...' : 'BULK VERIFY →'}
            </button>

            {bulkVerifying && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ width: 40, height: 40, border: `3px solid ${border}`, borderTopColor: green, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
                <div style={{ fontSize: 12, color: '#888' }}>Checking credentials on Solana...</div>
              </div>
            )}

            {bulkResults.length > 0 && !bulkVerifying && (
              <div>
                <div style={{ fontSize: 11, color: '#555', letterSpacing: 1, marginBottom: 16 }}>
                  {bulkResults.filter(r => r.found).length}/{bulkResults.length} VERIFIED
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {bulkResults.map((r, i) => (
                    <div key={r.id + i} style={{
                      padding: '16px 20px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      border: `1px solid ${r.found ? 'rgba(0,255,136,.2)' : 'rgba(255,60,60,.2)'}`,
                      background: r.found ? 'rgba(0,255,136,.03)' : 'rgba(255,60,60,.03)',
                      animation: `fadeUp .3s ease ${i * .05}s both`,
                    }}>
                      <div>
                        <span style={{ fontSize: 13, color: r.found ? green : '#ff3c3c', fontWeight: 700, marginRight: 12 }}>
                          {r.found ? '✓' : '✗'} {r.id}
                        </span>
                        {r.credential && <span style={{ fontSize: 12, color: '#888' }}>{r.credential.name} · {r.credential.degree}</span>}
                      </div>
                      <span style={{ fontSize: 10, color: r.found ? green : '#ff3c3c', letterSpacing: 1 }}>
                        {r.found ? 'VALID' : 'NOT FOUND'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
