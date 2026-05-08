'use client';
import { use, useState, useEffect } from 'react';
import { isRevoked, isExpired, getAllCredentialsFlat } from '../../lib/store';
import { generateCertificatePDF } from '../../lib/certificate';

const font = "'Courier New', monospace";
const bg = '#0a0a0f';
const card = '#0f0f1a';
const green = '#00ff88';
const blue = '#0066ff';
const yellow = '#ffaa00';
const red = '#ff3c3c';
const border = '#1e1e2e';
const grad = `linear-gradient(135deg, ${green}, ${blue})`;

const KEYFRAMES = `
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,255,136,.4)}70%{box-shadow:0 0 0 10px rgba(0,255,136,0)}}
@keyframes spin{to{transform:rotate(360deg)}}
`;

function getAllCredentials() {
  return getAllCredentialsFlat();
}

export default function VerifyPage({ params }: { params: Promise<{ credentialId: string }> }) {
  const { credentialId } = use(params);
  const [pageStatus, setPageStatus] = useState<'loading' | 'done'>('loading');
  const [credential, setCredential] = useState<any>(null);
  const [credStatus, setCredStatus] = useState<'valid' | 'expired' | 'revoked' | 'not_found'>('valid');
  const [startTime] = useState(Date.now());
  const [verifyTime, setVerifyTime] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const all = getAllCredentials();
      const found = all.find(c => c.id === credentialId);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      setVerifyTime(elapsed + 's');
      if (found) {
        setCredential(found);
        let status: 'valid' | 'expired' | 'revoked' = 'valid';
        if (isRevoked(found.id)) status = 'revoked';
        else if (isExpired(found.expiresAt)) status = 'expired';
        setCredStatus(status);
      } else {
        setCredStatus('not_found');
      }
      setPageStatus('done');
    }, 1200);
    return () => clearTimeout(timer);
  }, [credentialId, startTime]);

  const statusConfig = {
    valid: { icon: '✓', title: 'CREDENTIAL VERIFIED', color: green, bgColor: 'rgba(0,255,136,.1)', borderColor: green },
    expired: { icon: '⏱', title: 'CREDENTIAL EXPIRED', color: yellow, bgColor: 'rgba(255,170,0,.1)', borderColor: yellow },
    revoked: { icon: '⊘', title: 'CREDENTIAL REVOKED', color: red, bgColor: 'rgba(255,60,60,.1)', borderColor: red },
    not_found: { icon: '✗', title: 'NOT FOUND', color: red, bgColor: 'rgba(255,60,60,.1)', borderColor: red },
  };

  const cfg = statusConfig[credStatus];

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: font, color: '#e8e8e8', display: 'flex', flexDirection: 'column' }}>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: .3, backgroundImage: 'radial-gradient(circle, #1e1e2e 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <nav style={{ display: 'flex', alignItems: 'center', padding: '16px 32px', borderBottom: `1px solid ${border}`, background: 'rgba(10,10,15,.92)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: grad, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: bg }}>V</div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: green }}>VERIDICHAIN</span>
        </a>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        {pageStatus === 'loading' && (
          <div style={{ textAlign: 'center', animation: 'fadeUp .4s ease both' }}>
            <div style={{ width: 48, height: 48, border: `3px solid ${border}`, borderTopColor: green, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 24px' }} />
            <div style={{ fontSize: 14, color: '#888', letterSpacing: 1 }}>VERIFYING ON SOLANA...</div>
            <div style={{ fontSize: 11, color: '#444', marginTop: 8 }}>Checking on-chain data for {credentialId}</div>
          </div>
        )}

        {pageStatus === 'done' && credStatus !== 'not_found' && credential && (
          <div style={{ maxWidth: 480, width: '100%', animation: 'fadeUp .5s ease both' }}>
            {/* status badge */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', background: cfg.bgColor,
                border: `2px solid ${cfg.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 36, color: cfg.color,
                animation: credStatus === 'valid' ? 'pulse 2s infinite' : 'none',
              }}>{cfg.icon}</div>
              <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 4px', color: cfg.color }}>{cfg.title}</h1>
              <div style={{ fontSize: 12, color: '#888' }}>Verified in {verifyTime} on Solana Devnet</div>
            </div>

            {/* warning banner for expired/revoked */}
            {credStatus === 'expired' && (
              <div style={{ padding: '12px 16px', background: 'rgba(255,170,0,.05)', border: `1px solid ${yellow}`, borderRadius: 8, marginBottom: 20, fontSize: 12, color: yellow }}>
                ⚠ This credential has expired on {credential.expiresAt ? new Date(credential.expiresAt).toLocaleDateString() : 'N/A'}. Contact the issuer for renewal.
              </div>
            )}
            {credStatus === 'revoked' && (
              <div style={{ padding: '12px 16px', background: 'rgba(255,60,60,.05)', border: `1px solid ${red}`, borderRadius: 8, marginBottom: 20, fontSize: 12, color: red }}>
                ⊘ This credential has been revoked by the issuer. It is no longer valid.
              </div>
            )}

            {/* credential card */}
            <div style={{
              padding: 32, borderRadius: 16, border: `1px solid ${credStatus === 'valid' ? 'rgba(0,255,136,.2)' : `${cfg.borderColor}33`}`,
              background: `linear-gradient(170deg, ${card}, ${cfg.bgColor.replace('.1', '.03')})`,
              boxShadow: `0 0 40px ${cfg.bgColor.replace('.1', '.06')}`,
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{credential.degree}</div>
              <div style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>{credential.institution} · {credential.year}</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'RECIPIENT', value: credential.name },
                  { label: 'CREDENTIAL ID', value: credential.id },
                  { label: 'STATUS', value: credStatus === 'valid' ? '● Valid' : credStatus === 'expired' ? '⏱ Expired' : '⊘ Revoked', color: cfg.color },
                  { label: 'ISSUED', value: credential.issuedAt ? new Date(credential.issuedAt).toLocaleDateString() : 'On-chain' },
                  ...(credential.expiresAt ? [{ label: 'EXPIRES', value: new Date(credential.expiresAt).toLocaleDateString(), color: isExpired(credential.expiresAt) ? yellow : '#e8e8e8' }] : []),
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 10, color: '#555', letterSpacing: 1, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: (item as any).color || '#e8e8e8', fontWeight: 600 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(0,0,0,.3)', borderRadius: 8, fontSize: 11, color: '#555' }}>
                TX: <span style={{ color: blue }}>{credential.txHash}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, flexWrap: 'wrap', gap: 12 }}>
              <a href="/" style={{ fontSize: 12, color: '#555', textDecoration: 'none' }}>← Back to VeridiChain</a>
              {credStatus === 'valid' && (
                <button onClick={() => generateCertificatePDF(credential)} style={{
                  background: 'none', border: `1px solid ${border}`, color: '#888', padding: '6px 16px',
                  borderRadius: 6, cursor: 'pointer', fontFamily: font, fontSize: 11, letterSpacing: 1,
                }}>📄 DOWNLOAD PDF</button>
              )}
            </div>
          </div>
        )}

        {pageStatus === 'done' && credStatus === 'not_found' && (
          <div style={{ maxWidth: 480, width: '100%', textAlign: 'center', animation: 'fadeUp .5s ease both' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,60,60,.1)', border: '2px solid #ff3c3c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>✗</div>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 8px', color: '#ff3c3c' }}>NOT FOUND</h1>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>No credential with ID <span style={{ color: '#e8e8e8' }}>{credentialId}</span> found on Solana.</p>
            <a href="/" style={{ padding: '12px 28px', background: grad, color: bg, borderRadius: 8, fontFamily: font, fontWeight: 900, fontSize: 12, letterSpacing: 1, textDecoration: 'none' }}>GO TO VERIDICHAIN</a>
          </div>
        )}
      </div>

      <footer style={{ borderTop: `1px solid ${border}`, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#444', position: 'relative', zIndex: 1 }}>
        <span>VERIDICHAIN · SOLANA FRONTIER HACKATHON 2026</span>
        <span>On-chain verification</span>
      </footer>
    </div>
  );
}
