import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { IDL } from '@/idl/pact';
import type { Pact } from '@/idl/pact';

// export const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
export const connection = new Connection('http://10.0.2.2:8899', 'confirmed');
const PACT_PROGRAM_ID = new PublicKey('HBSRo9sKjWmqTteMRPjVF2xcqratjhF5Hu5GozqctNA4');

export const getPactProgram = (connection: Connection, wallet: any): Program<Pact> => {
  const provider = new AnchorProvider(connection, wallet, {});
  const program = new Program<Pact>(IDL, PACT_PROGRAM_ID, provider);
  return program;
};
