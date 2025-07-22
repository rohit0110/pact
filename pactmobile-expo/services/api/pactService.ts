import { Connection, Keypair, SystemProgram, TransactionMessage, VersionedTransaction, PublicKey } from '@solana/web3.js';


const BASE_URL = 'http://10.0.2.2:3000';

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

// Placeholder for your backend's fee payer address
const BACKEND_FEE_PAYER_ADDRESS = 'DfhwXBtE5D9R3Sg5tLpGjaq1bj7J6vuSrcBjRpzD8Sss'; // <<< IMPORTANT: Replace with your backend's actual fee payer public key

export const createPact = async (pactData: {
  name: string;
  description: string;
  stake: number;
  pactType: string;
}, userPublicKey: PublicKey, provider: any) => {
  try {
    // --- Start of prepareSponsoredTransaction logic ---

    // Dummy instruction for now. REPLACE THIS with your actual Pact program's instructions.
    // This example uses a simple SystemProgram.transfer instruction.
    const instructions = [
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: Keypair.generate().publicKey, // Dummy recipient
        lamports: 1000, // Dummy amount
      }),
    ];

    // Create a connection to Solana
    const connection = new Connection('https://api.devnet.solana.com'); // Use your desired network
    const { blockhash } = await connection.getLatestBlockhash();

    // Create the transaction message with fee payer set to the backend wallet
    const message = new TransactionMessage({
      payerKey: new PublicKey(BACKEND_FEE_PAYER_ADDRESS),
      recentBlockhash: blockhash,
      instructions
    }).compileToV0Message();

    // Create transaction
    const transaction = new VersionedTransaction(message);

    // Serialize message for signing
    const serializedMessage = Buffer.from(transaction.message.serialize()).toString('base64');

    // Get provider and sign
    if (!provider) {
      throw new Error('Failed to get wallet provider.');
    }

    const { signature: serializedUserSignature } = await provider.request({
      method: 'signMessage',
      params: { message: serializedMessage }
    });

    // Add user signature to transaction
    const userSignature = Buffer.from(serializedUserSignature, 'base64');
    transaction.addSignature(userPublicKey, userSignature);

    // Serialize the transaction to send to backend
    const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');

    // Send to your backend relay endpoint
    const response = await fetch(`${BASE_URL}/api/relay-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transaction: serializedTransaction })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Pact created successfully:', data);
    return data;

    // --- End of prepareSponsoredTransaction logic ---

  } catch (e) {
    console.error("Failed to create pact:", e);
    throw e;
  }
}
