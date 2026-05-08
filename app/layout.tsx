import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "./components/Toast";

export const metadata: Metadata = {
  title: "VeridiChain — Zero-Trust Hiring on Solana",
  description:
    "Issue, verify, and own academic and professional credentials on the Solana blockchain. Immutable, instant, fraud-proof hiring infrastructure for the future.",
  keywords: ["solana", "blockchain", "credentials", "hiring", "verification", "web3"],
  openGraph: {
    type: "website",
    siteName: "VeridiChain",
    title: "VeridiChain — Zero-Trust Hiring on Solana",
    description:
      "One link replaces your entire resume — immutable, instant, fraud-proof credentials on Solana.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VeridiChain — Decentralized Credential Verification on Solana",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VeridiChain — Zero-Trust Hiring on Solana",
    description:
      "One link replaces your entire resume — immutable, instant, fraud-proof credentials on Solana.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
