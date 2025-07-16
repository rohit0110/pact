import express from 'express';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { Connection, Keypair, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { openDb } from './database';
import { runIndexer } from './indexer';
import { IDL, Pact } from './idl/idl';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';

dotenv.config();

// --- Solana Setup ---

/**
 * Establishes a connection to the Solana cluster.
 * @returns {Connection} The connection object.
 */
function getSolanaConnection(): Connection {
  const url = process.env.SOLANA_CLUSTER_URL;
  if (!url) {
    throw new Error('SOLANA_CLUSTER_URL is not defined in the .env file.');
  }
  return new Connection(url, 'confirmed');
}

/**
 * Loads a Keypair from a base58 encoded private key.
 * @param privateKey The base58 encoded private key.
 * @returns {Keypair} The loaded Keypair.
 */
function loadKeypairFromPrivateKey(privateKey: string): Keypair {
    try {
        const secret = bs58.decode(privateKey);
        return Keypair.fromSecretKey(secret);
    } catch (error) {
        throw new Error('Failed to load keypair from private key. Ensure it is a valid base58 string.');
    }
}

/**
 * Loads the application's main vault keypair.
 * NOTE: In the current implementation, this keypair serves two roles:
 * 1. The Relayer: It pays for user-initiated transactions.
 * 2. The Oracle: It signs transactions for automated tasks like updating pacts.
 * For enhanced security in the future, these roles should be split into two separate keys.
 * @returns {Keypair} The App Vault Keypair.
 */
function getAppVaultKeypair(): Keypair {
  const privateKey = process.env.APP_VAULT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('APP_VAULT_PRIVATE_KEY is not defined in the .env file.');
  }
  return loadKeypairFromPrivateKey(privateKey);
}


// --- Oracle & Indexer Logic ---

/**
 * The main function for the oracle's cron job.
 * It first updates the local database with the latest on-chain data,
 * then it checks active pacts and updates their status based on real-world data.
 */
async function runOracleAndIndexer() {
  console.log('Running the oracle and indexer check...');
  try {
    const connection = getSolanaConnection();
    const appVaultKeypair = getAppVaultKeypair();
    const wallet = new Wallet(appVaultKeypair);
    // Create an Anchor provider with the connection and wallet
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    const program = new Program<Pact>(IDL, process.env.PROGRAM_ID!, provider);

    // Step 1: Run the indexer to sync on-chain data to the local DB
    await runIndexer(connection, program);

    // Step 2: Perform the oracle checks using the now-synced data
    console.log('Starting oracle checks...');
    const db = await openDb();
    const activePacts = await db.all("SELECT * FROM pacts WHERE status = 'Active'");
    const completedPacts = await db.all("SELECT * FROM pacts WHERE status = 'completed'");
    console.log(`Found ${activePacts.length} active pacts.`);
    console.log(`Found ${completedPacts.length} completed pacts.`);

    // TODO: Loop through active pacts and perform oracle logic as before

    console.log('Oracle and indexer check completed successfully.');
  } catch (error) {
    console.error('Error during oracle and indexer check:', error);
  }
}

// --- Express Server Setup ---

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Pact Oracle and Indexer Service is running!');
});

/**
 * API endpoint to get all indexed pacts.
 */
app.get('/api/pacts', async (req, res) => {
    try {
        const db = await openDb();
        const pacts = await db.all('SELECT * FROM pacts');
        res.status(200).json(pacts);
    } catch (error) {
        console.error('Error in /api/pacts:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * API endpoint to relay and pay for user-initiated transactions.
 */
app.post('/api/relay-transaction', async (req, res) => {
  try {
    const { transaction: base64Transaction } = req.body;

    if (!base64Transaction) {
      return res.status(400).json({ error: 'Transaction not provided.' });
    }

    const connection = getSolanaConnection();
    const appVaultKeypair = getAppVaultKeypair();

    // TODO: 1. Deserialize the transaction
    // const transactionBuffer = Buffer.from(base64Transaction, 'base64');
    // const transaction = Transaction.from(transactionBuffer);

    // TODO: 2. Security Verification
    // - Check that the feePayer is the appVaultKeypair.publicKey
    // - Check the instruction programId and that it's an allowed instruction

    // TODO: 3. Sign the transaction with the app vault's key
    // transaction.partialSign(appVaultKeypair);

    // TODO: 4. Send and confirm the transaction
    // const signature = await connection.sendRawTransaction(transaction.serialize());
    // await connection.confirmTransaction(signature, 'confirmed');

    // For now, returning a placeholder signature
    const signature = '2xJ...placeholder...4vT';

    res.status(200).json({ signature });

  } catch (error) {
    console.error('Error in /api/relay-transaction:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(port, async () => {
  // Open the database connection when the server starts
  await openDb(); 
  console.log(`Server is listening on port ${port}`);
  await runOracleAndIndexer(); // run once immediately

  // Schedule the oracle to run every 10 minutes.
  cron.schedule('*/10 * * * *', runOracleAndIndexer);
});