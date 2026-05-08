import QRCode from 'qrcode';

export async function generateQRDataURL(credentialId: string): Promise<string> {
  const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://veridichain.app'}/verify/${credentialId}`;
  return QRCode.toDataURL(url, {
    width: 256,
    margin: 2,
    color: { dark: '#00ff88', light: '#0a0a0f' },
    errorCorrectionLevel: 'H',
  });
}

export function getVerifyURL(credentialId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://veridichain.app';
  return `${origin}/verify/${credentialId}`;
}
