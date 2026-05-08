'use client';

const font = "'Courier New', monospace";
const bg = '#0a0a0f';
const green = '#00ff88';
const blue = '#0066ff';
const border = '#1e1e2e';
const grad = `linear-gradient(135deg, ${green}, ${blue})`;

const FOOTER_KEYFRAMES = `
@keyframes footerPulse {
  0%, 100% { opacity: .6; }
  50% { opacity: 1; }
}
`;

export default function Footer() {
  return (
    <footer style={{
      borderTop: `1px solid ${border}`,
      background: 'rgba(10,10,15,.95)',
      backdropFilter: 'blur(16px)',
      padding: '48px 32px 32px',
      fontFamily: font,
      position: 'relative',
      zIndex: 1,
    }}>
      <style dangerouslySetInnerHTML={{ __html: FOOTER_KEYFRAMES }} />

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Top section: Logo + Nav */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 40, marginBottom: 40,
        }}>
          {/* Brand */}
          <div style={{ maxWidth: 320 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 28, height: 28, background: grad, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 12, color: bg,
              }}>V</div>
              <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, color: green }}>VERIDICHAIN</span>
            </div>
            <p style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>
              The decentralized credential verification platform built on Solana.
              Issue, verify, and own your credentials — immutable, instant, fraud-proof.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 10, color: '#444', letterSpacing: 2, marginBottom: 14, fontWeight: 700 }}>PLATFORM</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="/" style={{ fontSize: 12, color: '#888', textDecoration: 'none', transition: 'color .2s' }}>Home</a>
                <a href="/employer" style={{ fontSize: 12, color: '#888', textDecoration: 'none', transition: 'color .2s' }}>Employer Dashboard</a>
                <a href="/institution" style={{ fontSize: 12, color: '#888', textDecoration: 'none', transition: 'color .2s' }}>Institution Registry</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#444', letterSpacing: 2, marginBottom: 14, fontWeight: 700 }}>RESOURCES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="https://solana.com" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}>Solana ↗</a>
                <a href="https://explorer.solana.com/?cluster=devnet" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}>Solana Explorer ↗</a>
                <a href="https://phantom.app" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}>Phantom Wallet ↗</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#444', letterSpacing: 2, marginBottom: 14, fontWeight: 700 }}>BUILT WITH</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#555' }}>Next.js 16</span>
                <span style={{ fontSize: 12, color: '#555' }}>Solana Web3.js</span>
                <span style={{ fontSize: 12, color: '#555' }}>TypeScript</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: border, marginBottom: 24 }} />

        {/* Bottom bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 11, color: '#444' }}>© 2026 VeridiChain</span>
            <span style={{ fontSize: 11, color: '#333' }}>|</span>
            <span style={{ fontSize: 11, color: '#444' }}>Colosseum Solana Frontier Hackathon</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Solana powered badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 20,
              border: `1px solid rgba(0,102,255,.2)`,
              background: 'rgba(0,102,255,.05)',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: green, animation: 'footerPulse 2s ease infinite',
              }} />
              <span style={{ fontSize: 10, color: blue, letterSpacing: 1, fontWeight: 700 }}>POWERED BY SOLANA</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
