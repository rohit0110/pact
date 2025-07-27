import { Connection, SystemProgram, TransactionMessage, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getPactProgram } from '@/program/pact';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.BASE_URL;
const BACKEND_FEE_PAYER_ADDRESS = Constants.expoConfig?.extra?.BACKEND_FEE_PAYER_ADDRESS;
const SOLANA_RPC_URL = Constants.expoConfig?.extra?.SOLANA_RPC_URL;

export const fetchPlayerProfile = async (pubkey: string) => {
  try {
    console.log(`Fetching profile for public key: ${pubkey}`);
    const response = await fetch(`${BASE_URL}/api/players/${pubkey}`);
    if (!response.ok) {
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

export const createPlayerProfile = async (userPublicKey: PublicKey, name: string, provider: any) => {
  try {
    console.log(`Creating profile for public key: ${userPublicKey.toBase58()}`);
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    const program = getPactProgram(connection, provider);

    const [playerProfilePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("player_profile"), userPublicKey.toBuffer()],
      program.programId
    );

    const instruction = await program.methods
      .initializePlayerProfile(name)
      .accounts({
        playerProfile: playerProfilePDA,
        appVault: new PublicKey(BACKEND_FEE_PAYER_ADDRESS),
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
        params: { message: serializedMessage, display: 'utf8' },
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
    console.log('Profile creation transaction sent:', data);
    return data;
  } catch (e) {
    console.error("Failed to create player profile:", e);
    throw e;
  }
};

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
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    const program = getPactProgram(connection, provider);

    const [playerProfilePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("player_profile"), userPublicKey.toBuffer()],
        program.programId
    );

    const [challengePactPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("challenge_pact"), Buffer.from(pactData.name), userPublicKey.toBuffer()],
        program.programId
    );

    const [playerGoalPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("player_pact_profile"), userPublicKey.toBuffer(), challengePactPDA.toBuffer()],
        program.programId
    );

    const [pactVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("pact_vault"), challengePactPDA.toBuffer()],
        program.programId
    );

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
        challengePact: challengePactPDA,
        playerGoal: playerGoalPDA,
        pactVault: pactVaultPDA,
        appVault: new PublicKey(BACKEND_FEE_PAYER_ADDRESS),
        playerProfile: playerProfilePDA,
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

export const stakeInPact = async (pactPubkey: PublicKey, userPublicKey: PublicKey, provider: any, amount: number) => {
  try {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    const program = getPactProgram(connection, provider);

    const [pactVaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("pact_vault"), pactPubkey.toBuffer()],
      program.programId
    );

    const [playerGoalPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("player_pact_profile"), userPublicKey.toBuffer(), pactPubkey.toBuffer()],
      program.programId
    );

    const instruction = await program.methods
      .stakeAmountForChallengePact(new BN(amount))
      .accounts({
        challengePact: pactPubkey,
        playerGoal: playerGoalPDA,
        pactVault: pactVaultPDA,
        appVault: new PublicKey(BACKEND_FEE_PAYER_ADDRESS),
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
        params: { message: serializedMessage, display: 'utf8' },
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
    console.log('Stake transaction sent:', data);
    return data;
  } catch (e) {
    console.error("Failed to stake in pact:", e);
    throw e;
  }
};

export const startChallengePact = async (pact_pubkey: PublicKey, userPublicKey: PublicKey, provider: any, participants: any[]) => {
  try {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    const program = getPactProgram(connection, provider);

    const remainingAccounts = participants.map(p => {
      const [playerGoalPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("player_pact_profile"), new PublicKey(p.pubkey).toBuffer(), pact_pubkey.toBuffer()],
        program.programId
      );
      return { pubkey: playerGoalPDA, isSigner: false, isWritable: false };
    });

    const instruction = await program.methods
      .startChallengePact()
      .accounts({
        challengePact: pact_pubkey,
        appVault: new PublicKey(BACKEND_FEE_PAYER_ADDRESS),
        player: userPublicKey,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts(remainingAccounts)
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
        params: { message: serializedMessage, display: 'utf8' },
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
    console.log('Start Pact transaction sent:', data);
    return data;
  } catch (e) {
    console.error("Failed to Start Pact", e);
    throw e;
  } 
}
