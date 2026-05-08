<p align="center">
  <img src="https://img.shields.io/badge/Solana-Devnet-blue?style=for-the-badge&logo=solana" />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Hackathon-Colosseum%20Frontier%202026-green?style=for-the-badge" />
</p>

<h1 align="center">⛓️ VeridiChain</h1>
<h3 align="center">Zero-Trust Hiring Infrastructure on Solana</h3>

<p align="center">
  <strong>Issue, verify, and own academic & professional credentials on-chain.</strong><br/>
  One link replaces your entire resume — immutable, instant, fraud-proof.
</p>

---

## 🚨 The Problem

**Credential fraud is a $600B+ problem.** According to the FBI, 40% of resumes contain fabricated credentials. Traditional verification takes 2-4 weeks and costs $50-200 per check. Employers have no way to instantly verify a candidate's education, certifications, or skills.

**Current pain points:**
- 📄 Paper credentials are easily forged
- ⏱ Verification is slow (weeks, not seconds)
- 💰 Background checks are expensive
- 🔒 Candidates don't own their credentials — institutions do
- 🌍 Cross-border verification is nearly impossible

## ✅ The Solution

**VeridiChain** is a decentralized credential verification platform built on **Solana** that enables:

1. **Institutions** → Register on-chain and mint verified credentials for students
2. **Candidates** → Own their credentials in a Web3 wallet, share via a single link
3. **Employers** → Instantly verify any credential with one click — zero trust required

### Why Solana?
- ⚡ **400ms finality** — credentials verified in real-time
- 💸 **$0.00025 per transaction** — practically free to issue
- 🔐 **Immutable** — once on-chain, credentials cannot be tampered with
- 🌐 **Global** — no borders, no intermediaries

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   INSTITUTION   │     │    CANDIDATE      │     │    EMPLOYER      │
│                 │     │                   │     │                  │
│ • Register      │────▶│ • Receive Creds   │────▶│ • Search         │
│ • Issue Creds   │     │ • Build Profile   │     │ • Verify (1-click│
│ • Verify PRN    │     │ • Share Link/QR   │     │ • Bulk Verify    │
│ • Revoke        │     │ • Apply to Jobs   │     │ • View Profiles  │
└────────┬────────┘     └────────┬──────────┘     └────────┬─────────┘
         │                       │                          │
         └───────────────────────┼──────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     SOLANA DEVNET       │
                    │                         │
                    │  • Memo Program (txns)  │
                    │  • Phantom Wallet       │
                    │  • On-chain proofs      │
                    │  • Immutable records    │
                    └─────────────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔗 **Phantom Wallet** | Connect via Phantom to sign and issue credentials |
| 🏛 **Institution Registry** | Verified institutions get a blue-tick badge |
| 🎓 **Credential Minting** | Issue credentials with on-chain Solana transactions |
| ✅ **Instant Verification** | Verify any credential by ID, TX hash, or application code |
| 📱 **QR Code Sharing** | Each credential gets a scannable QR code |
| 📄 **PDF Certificates** | Download branded PDF certificates with QR + TX proof |
| 👤 **Candidate Profiles** | Rich profiles with avatar, skills, bio, and vanity URLs (`/u/username`) |
| ⚡ **Verified Skills** | Add skills via badge URLs (Credly, Coursera, etc.) for blue-tick verification |
| 🏢 **Employer Dashboard** | Search candidates, filter by skills, bulk-verify credential IDs |
| 💼 **Application Codes** | Generate one-time `APP-XXXX` codes for recruiters |
| ⏱ **Credential Lifecycle** | Full lifecycle: Issue → Verify → Expire → Revoke |
| 🔍 **PRN Search** | Institutions can verify students by PRN/certificate number |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Phantom Wallet](https://phantom.app/) browser extension
- Solana Devnet SOL (free from [faucet](https://faucet.solana.com/))

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/veridichain.git
cd veridichain

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Flow

1. **Install Phantom** → Switch to Devnet in Settings → Networks
2. **Get Devnet SOL** → Visit [faucet.solana.com](https://faucet.solana.com/)
3. **Connect Wallet** → Click "CONNECT PHANTOM" on the homepage
4. **Issue a Credential** → Go to Issue tab → Fill in details → Mint on Solana
5. **Verify It** → Copy the Credential ID → Go to Verify tab → Paste & verify
6. **View Profile** → Click "MY PROFILE" → See all credentials + skills
7. **Employer View** → Visit /employer → Search and bulk-verify credentials

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Blockchain** | Solana (Devnet), `@solana/web3.js` |
| **Wallet** | Phantom Wallet (browser extension) |
| **On-chain Program** | Solana Memo Program (`MemoSq4g...`) |
| **PDF Generation** | jsPDF |
| **QR Codes** | qrcode (npm) |
| **State** | localStorage (client-side persistence) |
| **Styling** | CSS-in-JS (inline styles with design system) |

---

## 📁 Project Structure

```
veridichain/
├── app/
│   ├── page.tsx              # Landing page + Issue/Verify/Wallet tabs
│   ├── layout.tsx            # Root layout with metadata
│   ├── globals.css           # Design system tokens
│   ├── components/
│   │   ├── Toast.tsx         # Toast notification system
│   │   └── Footer.tsx        # Reusable footer component
│   ├── employer/
│   │   └── page.tsx          # Employer dashboard (search + bulk verify)
│   ├── institution/
│   │   └── page.tsx          # Institution registry + student verification
│   ├── profile/[wallet]/
│   │   └── page.tsx          # Candidate profile (edit, skills, credentials)
│   ├── u/[username]/
│   │   └── page.tsx          # Public vanity profile page
│   ├── verify/[credentialId]/
│   │   └── page.tsx          # Credential verification page
│   └── lib/
│       ├── store.ts          # Central data store (profiles, credentials)
│       ├── solana.ts          # Solana blockchain integration
│       ├── certificate.ts     # PDF certificate generator
│       ├── qrcode.ts          # QR code generator
│       └── credentialStore.ts # Legacy credential store
└── public/                    # Static assets
```

---

## 🔮 Future Roadmap

- [ ] **Mainnet deployment** with Solana Program (Anchor/Rust)
- [ ] **DID integration** (Decentralized Identifiers) for self-sovereign identity
- [ ] **Zero-knowledge proofs** for privacy-preserving verification
- [ ] **Multi-chain support** (Ethereum, Polygon)
- [ ] **AI-powered skill matching** for employer-candidate pairing
- [ ] **Mobile app** (React Native + Phantom Mobile SDK)

---

## 👨‍💻 Team

**Built by Pranav Mahajan** for the Colosseum Solana Frontier Hackathon 2026.

---

<p align="center">
  <strong>⛓️ VeridiChain — Your credentials, on-chain, forever.</strong>
</p>
