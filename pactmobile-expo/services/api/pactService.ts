import { Connection, Keypair, SystemProgram, TransactionMessage, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getPactProgram } from '@/program/pact';

const BASE_URL = 'http://10.0.2.2:3000';

export const fetchPlayerProfile = async (pubkey: string) => {
  try {
    console.log(`Fetching profile for public key: ${pubkey}`);
    const response = await fetch(`${BASE_URL}/api/players/${pubkey}`);
    if (!response.ok) {
      console.log("TILL HERE");
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Profile data fetched:', data);
    return data;  
  } catch (e) {
    console.error("Failed to fetch player profile:", e);
    throw e;
  }
};

export const fetchPacts = async (pubkey: string) => {
  try {
    const response = await fetch(`${BASE_URL}/api/players/${pubkey}/pacts`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (e) {
    console.error("Failed to fetch pacts:", e);
    throw e;
  }
};

export const fetchAllPacts = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/pacts/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (e) {
    console.error("Failed to fetch pact details:", e);
    throw e;
  }
};

export const createPlayerProfile = async (pubkey: string, name: string) => {
  try {
    console.log(`Creating profile for public key: ${pubkey}`);
    const response = await fetch(`${BASE_URL}/api/players`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ "pubkey": pubkey, "name": name }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Profile created:', data);
    return data;
  } catch (e) {
    console.error("Failed to create player profile:", e);
    throw e;
  }
};

// Placeholder for your backend's fee payer address
const BACKEND_FEE_PAYER_ADDRESS = 'DfhwXBtE5D9R3Sg5tLpGjaq1bj7J6vuSrcBjRpzD8Sss'; // <<< IMPORTANT: Replace with your backend's actual fee payer public key

export const createPact = async (pactData: {
  name: string;
  description: string;
  stake: number;
  pactType: string;
  goalType: any;
  goalValue: number;
  verificationType: any;
  comparisonOperator: any;
}, userPublicKey: PublicKey, provider: any) => {
  try {
    const connection = new Connection('http://10.0.2.2:8899', 'confirmed');
    const program = getPactProgram(connection, provider);

    const challengePact = Keypair.generate();
    const playerGoal = Keypair.generate();
    const pactVault = Keypair.generate();

    const instruction = await program.methods
      .initializeChallengePact(
        pactData.name,
        pactData.description,
        pactData.goalType,
        new BN(pactData.goalValue),
        pactData.verificationType,
        pactData.comparisonOperator,
        new BN(pactData.stake)
      )
      .accounts({
        challengePact: challengePact.publicKey,
        playerGoal: playerGoal.publicKey,
        pactVault: pactVault.publicKey,
        appVault: new PublicKey(BACKEND_FEE_PAYER_ADDRESS),
        playerProfile: userPublicKey, // Assuming userPublicKey is the playerProfile
        player: userPublicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const { blockhash } = await connection.getLatestBlockhash();
    const message = new TransactionMessage({
      payerKey: new PublicKey(BACKEND_FEE_PAYER_ADDRESS),
      recentBlockhash: blockhash,
      instructions: [instruction],
    }).compileToV0Message();

    const transaction = new VersionedTransaction(message);
    const serializedMessage = Buffer.from(transaction.message.serialize()).toString('base64');

    const { signature: serializedUserSignature } = await provider.request({
      method: 'signMessage',
      params: { message: serializedMessage },
    });

    const userSignature = Buffer.from(serializedUserSignature, 'base64');
    transaction.addSignature(userPublicKey, userSignature);

    const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');

    const response = await fetch(`${BASE_URL}/api/relay-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction: serializedTransaction }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Pact created successfully:', data);
    return data;
  } catch (e) {
    console.error("Failed to create pact:", e);
    throw e;
  }
};
