import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

export const connection = new Connection("https://api.devnet.solana.com", "confirmed");

export async function writeCredentialToChain(
  wallet: any,
  credentialData: {
    id: string;
    name?: string;
    degree?: string;
    institution: string;
    year: string;
    recipientWallet: string;
    skills?: string;
    candidateName?: string;
  }
) {
  const memoData = JSON.stringify({
    app: "VERIDICHAIN",
    ...credentialData,
    issuedAt: new Date().toISOString(),
  });

  const { SystemProgram, TransactionInstruction } = await import("@solana/web3.js");

  const memoInstruction = new TransactionInstruction({
    keys: [],
    programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
    data: Buffer.from(memoData, "utf-8"),
  });

  const transaction = new Transaction().add(memoInstruction);
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = new PublicKey(wallet.publicKey.toString());

  const signed = await wallet.signTransaction(transaction);
  const txHash = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(txHash);

  return txHash;
}