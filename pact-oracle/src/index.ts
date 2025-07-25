import express from 'express';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { Connection, Keypair, PublicKey, SystemProgram, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { openDb } from './database';
import { runIndexer } from './indexer';
import { IDL, Pact } from './idl/idl';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
import { simulateTransaction } from '@coral-xyz/anchor/dist/cjs/utils/rpc';


dotenv.config();
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
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
 * API endpoint to create a new player profile.
 * This endpoint is used to initialize a player's profile in the database.
 */
app.post('/api/players', async (req, res) => {
  try {
    const { pubkey, name } = req.body;
    if (!pubkey || !name) {
      return res.status(400).json({ error: 'Public key and name are required.' });
    }

    const connection = getSolanaConnection();
    const appVaultKeypair = getAppVaultKeypair();
    const playerPubkey = new PublicKey(pubkey);

    const provider = new AnchorProvider(connection, new Wallet(appVaultKeypair), {});
    const program = new Program<Pact>(IDL, process.env.PROGRAM_ID!, provider);

    // Derive PDA
    const [playerProfilePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("player_profile"), playerPubkey.toBuffer()],
      program.programId
    );

    // Optional: skip if already exists
    const existing = await connection.getAccountInfo(playerProfilePDA);
    if (existing) {
      return res.status(409).json({ error: 'Player profile already exists.' });
    }

    // Build transaction
    const transaction = await program.methods
      .initializePlayerProfile(name)
      .accounts({
        playerProfile: playerProfilePDA,
        appVault: appVaultKeypair.publicKey,
        player: playerPubkey,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    transaction.feePayer = appVaultKeypair.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    // Sign and send
    transaction.partialSign(appVaultKeypair);
    const signature = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(signature, 'confirmed');

    res.status(200).json({
      signature,
      message: 'Player profile created successfully.',
    });

  } catch (error) {
    console.error('Error creating player profile transaction:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


/**
 * API endpoint to get all indexed pacts.
 * Most probably will not be used in production, but useful for debugging.
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
 * API endpoint to get all pacts a specific player is a part of.
 */
app.get('/api/players/:pubkey/pacts', async (req, res) => {
  try {
    const { pubkey } = req.params;
    const db = await openDb();

    // Get all pacts the player is a part of
    const pacts = await db.all(
      `
      SELECT T2.* 
      FROM participants AS T1 
      JOIN pacts AS T2 ON T1.pact_pubkey = T2.pubkey 
      WHERE T1.player_pubkey = ?
      `,
      pubkey
    );

    // For each pact, fetch all its participants (only pact-specific info)
    const detailedPacts = await Promise.all(
      pacts.map(async (pact) => {
        const participants = await db.all(
          `
          SELECT p.player_pubkey AS pubkey, p.has_staked, p.is_eliminated
          FROM participants AS p
          WHERE p.pact_pubkey = ?
          `,
          pact.pubkey
        );

        return {
          ...pact,
          participants,
        };
      })
    );

    res.status(200).json(detailedPacts);
  } catch (error) {
    console.error(`Error in /api/players/${req.params.pubkey}/pacts:`, error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});



/**
 * API endpoint to get details of a specific pact.
 * Most probably not needed since when we list pacts, we get all the details.
 */
app.get('/api/pacts/:pubkey', async (req, res) => {
  try {
    const pubkey = req.params.pubkey;
    if (!pubkey) {
      return res.status(400).json({ error: 'Public key not provided.' });
    }

    const db = await openDb();
    const pacts = await db.all('SELECT * FROM pacts WHERE pubkey = ?', [pubkey]);
    res.status(200).json(pacts);
  } catch (error) {
    console.error('Error in /api/pacts/:pubkey:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * API endpoint to get a player's profile.
 */
app.get('/api/players/:pubkey', async (req, res) => {
  try {
    const pubkey = req.params.pubkey;
    if (!pubkey) {
      return res.status(400).json({ error: 'Public key not provided.' });
    }
    const db = await openDb();
    const playerProfile = await db.get('SELECT * FROM player_profiles WHERE pubkey = ?', [pubkey]);
    if (!playerProfile) {
      return res.status(404).json({ error: 'Player profile not found.' });
    }
    res.status(200).json(playerProfile);
  } catch (error) {
    console.error('Error in /api/players/:pubkey:', error);
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

    const connection = getSolanaConnection(); // Your custom function
    const appVaultKeypair = getAppVaultKeypair(); // Your fee payer

    // 1. Deserialize
    const transactionBuffer = Buffer.from(base64Transaction, 'base64');
    const transaction = VersionedTransaction.deserialize(transactionBuffer);

    // 2. Security Check — Only allow if fee payer is vault
    if (!transaction.message || !transaction.message.staticAccountKeys[0].equals(appVaultKeypair.publicKey)) {
      return res.status(403).json({ error: 'Unauthorized fee payer.' });
    }

    // 3. Instruction whitelist
    for (const ix of transaction.message.compiledInstructions) {
      const programId = transaction.message.staticAccountKeys[ix.programIdIndex];
      if (!programId.equals(allowedProgramId)) {
        return res.status(403).json({ error: 'Contains instruction to non-whitelisted program.' });
      }

      const data = Buffer.from(ix.data);
      const discriminator = data.subarray(0, 8);
      const isAllowed = Object.values(allowedMethods).some((d) => discriminator.equals(d));
      if (!isAllowed) {
        return res.status(403).json({ error: 'Disallowed instruction in transaction.' });
      }
    }

    // 4. Partial sign
    transaction.sign([appVaultKeypair]);

    // 5. Relay
    const signature = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(signature, 'confirmed');

    console.log('✅ Relayed tx with signature:', signature);
    res.status(200).json({ signature });

  } catch (error) {
    console.error('❌ Relay error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


/*
  * API endpoint to delete a player profile.
  * This endpoint allows the deletion of a player's profile from the database.
  */
app.post('/api/delete/', async (req, res) => {
  try {
    const { pubkey } = req.body;
    if (!pubkey) {
      return res.status(400).json({ error: 'Public key not provided.' });
    }
    const db = await openDb();
    await db.run('DELETE FROM player_profiles WHERE pubkey = ?', [pubkey]);
    res.status(200).json({ message: 'Player profile deleted successfully.' });
  } catch (error) {
    console.error('Error deleting player profile:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


app.listen(port, async () => {
  // Open the database connection when the server starts
  await openDb(); 
  console.log(`Server is listening on port ${port}`);
  await runOracleAndIndexer(); // run once immediately

  // Schedule the oracle to run every 10 minutes.
  cron.schedule('* * * * *', runOracleAndIndexer);
});

// RATE LIMIT HELPER
const relayLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/relay-transaction', relayLimiter);

// HELPER FUNCTIONS
function getAnchorDiscriminator(name: string): Buffer {
  const preimage = `global:${name}`;
  return crypto.createHash('sha256').update(preimage).digest().subarray(0, 8);
}

const allowedMethods: { [key: string]: Buffer } = {
  initializePlayerProfile: getAnchorDiscriminator('initialize_player_profile'),
  initializeChallengePact: getAnchorDiscriminator('initialize_challenge_pact'),
  joinChallengePact: getAnchorDiscriminator('join_challenge_pact'),
  stakeAmountForChallengePact: getAnchorDiscriminator('stake_amount_for_challenge_pact'),
  startChallengePact: getAnchorDiscriminator('start_challenge_pact'),
  endChallengePact: getAnchorDiscriminator('end_challenge_pact'),
  updatePlayerGoal: getAnchorDiscriminator('update_player_goal')
};

const allowedProgramId = new PublicKey('HBSRo9sKjWmqTteMRPjVF2xcqratjhF5Hu5GozqctNA4');


