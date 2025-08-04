import express from 'express';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { Connection, Keypair, PublicKey, SystemProgram, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { openDb } from './database';
import { runIndexer } from './indexer';
import { IDL, Pact } from './idl/idl';
import { Program, AnchorProvider, Wallet, BorshCoder, Instruction } from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
import { runHourlyCheck, runEndOfDayCheck, runIndexerAndShit } from './oracle';

dotenv.config();
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const BN = require('bn.js');

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
// --- Express Server Setup ---

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Pact Oracle and Indexer Service is running!');
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
    const { pubkey } = req.params;
    if (!pubkey) {
      return res.status(400).json({ error: 'Public key not provided.' });
    }

    const db = await openDb();

    // Fetch the pact
    const pact = await db.get('SELECT * FROM pacts WHERE pubkey = ?', [pubkey]);
    if (!pact) {
      return res.status(404).json({ error: 'Pact not found.' });
    }

    // Fetch all participants for this pact
    const participants = await db.all(
      `
      SELECT player_pubkey AS pubkey, has_staked, is_eliminated
      FROM participants
      WHERE pact_pubkey = ?
      `,
      [pubkey]
    );

    res.status(200).json({
      ...pact,
      participants,
    });
  } catch (error) {
    console.error(`Error in /api/pacts/${req.params.pubkey}:`, error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/api/pacts/code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ error: 'Code not provided.' });
    }

    const db = await openDb();

    // Fetch the pact
    const pact = await db.get('SELECT * FROM pacts WHERE code = ?', [code]);
    if (!pact) {
      return res.status(404).json({ error: 'Pact not found.' });
    }

    // Fetch all participants for this pact
    const participants = await db.all(
      `
      SELECT player_pubkey AS pubkey, has_staked, is_eliminated
      FROM participants
      WHERE pact_pubkey = ?
      `,
      [pact.pubkey]
    );

    res.status(200).json({
      ...pact,
      participants,
    });
  } catch (error) {
    console.error(`Error in /api/pacts/code/${req.params.code}:`, error);
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
    const { transaction: base64Transaction, extra } = req.body as { transaction: string; extra?: { [key: string]: any } };

    if (!base64Transaction) {
      return res.status(400).json({ error: 'Transaction not provided.' });
    }

    const connection = getSolanaConnection();
    const appVaultKeypair = getAppVaultKeypair();
    const wallet = new Wallet(appVaultKeypair);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    const program = new Program<Pact>(IDL, process.env.PROGRAM_ID!, provider);

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

    // 6. Update database now that transaction is confirmed
    await updateDatabaseFromTransaction(program, transaction, extra);
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
  cron.schedule('0 * * * *', runIndexerAndShit);

  // Schedule the hourly check 0:05
  cron.schedule('55 * * * *', runHourlyCheck);

  // Schedule the end-of-day pact check 0 0
  cron.schedule('0 0 * * *', runEndOfDayCheck);
});

// RATE LIMIT HELPER
const relayLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/relay-transaction', relayLimiter);

// HELPER FUNCTIONS
function generateRandomCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateUniqueCode(db: any): Promise<string> {
  let code;
  let isUnique = false;
  while (!isUnique) {
    code = generateRandomCode(6);
    const existing = await db.get('SELECT 1 FROM pacts WHERE code = ?', [code]);
    if (!existing) {
      isUnique = true;
    }
  }
  return code as string;
}

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

export type InitializePlayerProfileArgs = {
  name: string;
};

export type InitializeChallengePactArgs = {
  name: string;
  description: string;
  goalType: { [key: string]: Record<string, unknown> }; // e.g., { dailyGithubContribution: {} }
  goalValue: typeof BN;
  verificationType: { [key: string]: Record<string, unknown> }; // e.g., { strava: {} }
  comparisonOperator: { [key: string]: Record<string, unknown> }; // e.g., { lessThanOrEqual: {} }
  stake: typeof BN;
};

export type JoinChallengePactArgs = Record<string, never>; // no args used

export type StakeAmountForChallengePactArgs = {
  amount: typeof BN;
};

export type StartChallengePactArgs = Record<string, never>;

export type EndChallengePactArgs = Record<string, never>;

export type UpdatePlayerGoalArgs = {
  isEliminated: boolean;
  eliminatedAt?: typeof BN;
};

async function updateDatabaseFromTransaction(
  program: Program<Pact>,
  transaction: VersionedTransaction,
  extra?: { [key: string]: any }
) {
  const coder = new BorshCoder(program.idl);

  for (const ix of transaction.message.compiledInstructions) {
    const programId = transaction.message.staticAccountKeys[ix.programIdIndex];
    
    // Ensure it's from your program
    if (!programId.equals(program.programId)) continue;

    const data = Buffer.from(ix.data);
    const decoded: Instruction | null = coder.instruction.decode(data);

    if (!decoded) {
      console.log('❌ Unable to decode instruction');
      continue;
    }

    console.log('✅ Decoded Instruction:');
    console.log('Name:', decoded.name);
    console.log('Args:', decoded.data);

    // Log account pubkeys
    const db = await openDb();

    switch (decoded.name) {
      case 'initializePlayerProfile': {
        const playerPubkey = transaction.message.staticAccountKeys[ix.accountKeyIndexes[2]];
        const data = decoded.data as InitializePlayerProfileArgs;
        const playerName = data.name;
        const playerGithubUsername = extra?.github_username;
        console.log("USERNAME IS: ", playerGithubUsername);
        await db.run(
          `INSERT INTO player_profiles (pubkey, name, github_username) VALUES (?, ?, ?)
           ON CONFLICT(pubkey) DO UPDATE SET name = excluded.name`,
          [playerPubkey.toBase58(), playerName, playerGithubUsername]
        );
        
        console.log(`Player profile ${playerName} (${playerPubkey.toBase58()}) handled.`);
        break;
      }
      case 'initializeChallengePact': {
        const challengePactPubkey = transaction.message.staticAccountKeys[ix.accountKeyIndexes[0]];
        const creatorPubkey = transaction.message.staticAccountKeys[ix.accountKeyIndexes[5]];
        const data = decoded.data as InitializeChallengePactArgs;
        const { name, description, stake, goalType, goalValue, verificationType, comparisonOperator } = data;
        const createdAt = Date.now(); // Use current timestamp for creation
        const status = 'Initialized'; // Initial status
        const code = await generateUniqueCode(db);
        console.log("THE CODE IS: ", code);
        await db.run(
          `INSERT OR IGNORE INTO pacts (pubkey, name, description, creator, status, stake_amount, prize_pool, goal_type, goal_value, created_at, code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            challengePactPubkey.toBase58(),
            name,
            description,
            creatorPubkey.toBase58(),
            status.toString(),
            stake.toString(), 
            0,
            Object.keys(goalType)[0],
            goalValue.toString(), 
            createdAt,
            code,
          ]
        );

        // Add creator as participant
        const playerPubkey = creatorPubkey;
        await db.run(
          `INSERT OR IGNORE INTO participants (pact_pubkey, player_pubkey, has_staked, is_eliminated) VALUES (?, ?, ?, ?)`,
          [challengePactPubkey.toBase58(), playerPubkey.toBase58(), false, false]
        );
        console.log(`Challenge pact ${name} (${challengePactPubkey.toBase58()}) initialized by ${creatorPubkey.toBase58()}.`);
        break;
      }
      case 'joinChallengePact': {
        const challengePactPubkey = transaction.message.staticAccountKeys[ix.accountKeyIndexes[0]];
        const playerPubkey = transaction.message.staticAccountKeys[ix.accountKeyIndexes[4]];

        await db.run(
          `INSERT OR IGNORE INTO participants (pact_pubkey, player_pubkey, has_staked, is_eliminated) VALUES (?, ?, ?, ?)`,
          [challengePactPubkey.toBase58(), playerPubkey.toBase58(), false, false]
        );
        console.log(`Player ${playerPubkey.toBase58()} joined pact ${challengePactPubkey.toBase58()}.`);
        break;
      }
      case 'stakeAmountForChallengePact': {
        const challengePactPubkey = transaction.message.staticAccountKeys[ix.accountKeyIndexes[0]];
        const playerPubkey = transaction.message.staticAccountKeys[ix.accountKeyIndexes[4]];
        const data = decoded.data as StakeAmountForChallengePactArgs;
        const stakeAmount = data.amount;

        await db.run(
          `UPDATE participants SET has_staked = ? WHERE pact_pubkey = ? AND player_pubkey = ?`,
          [true, challengePactPubkey.toBase58(), playerPubkey.toBase58()]
        );

        // Update prize pool in pacts table
        await db.run(
          `UPDATE pacts SET prize_pool = prize_pool + ? WHERE pubkey = ?`,
          [stakeAmount.toString(), challengePactPubkey.toBase58()]
        );
        console.log(`Player ${playerPubkey.toBase58()} staked ${stakeAmount.toString()} in pact ${challengePactPubkey.toBase58()}.`);
        break;
      }
      case 'startChallengePact': {
        const challengePactPubkey = transaction.message.staticAccountKeys[ix.accountKeyIndexes[0]];
        await db.run(
          `UPDATE pacts SET status = ? WHERE pubkey = ?`,
          ['Active', challengePactPubkey.toBase58()]
        );
        console.log(`Pact ${challengePactPubkey.toBase58()} started.`);
        break;
      }
      case 'endChallengePact': {
        const challengePactPubkey = transaction.message.staticAccountKeys[ix.accountKeyIndexes[0]];
        const winnerPubkey = transaction.message.staticAccountKeys[ix.accountKeyIndexes[2]];

        await db.run(
          `UPDATE pacts SET status = ? WHERE pubkey = ?`,
          ['Completed', challengePactPubkey.toBase58()]
        );

        // Update winner's pacts_won count
        await db.run(
          `UPDATE player_profiles SET pacts_won = pacts_won + 1 WHERE pubkey = ?`,
          [winnerPubkey.toBase58()]
        );

        // Update losers' pacts_lost count (all participants except winner)
        const participants = await db.all(
          `SELECT player_pubkey FROM participants WHERE pact_pubkey = ? AND player_pubkey != ?`,
          [challengePactPubkey.toBase58(), winnerPubkey.toBase58()]
        );
        for (const p of participants) {
          await db.run(
            `UPDATE player_profiles SET pacts_lost = pacts_lost + 1 WHERE pubkey = ?`,
            [p.player_pubkey]
          );
        }
        console.log(`Pact ${challengePactPubkey.toBase58()} ended. Winner: ${winnerPubkey.toBase58()}.`);
        break;
      }
      case 'updatePlayerGoal': {
        const playerGoalPubkey = transaction.message.staticAccountKeys[ix.accountKeyIndexes[0]];
        const challengePactPubkey = transaction.message.staticAccountKeys[ix.accountKeyIndexes[1]];
        const playerPubkey = transaction.message.staticAccountKeys[ix.accountKeyIndexes[3]];
        const data = decoded.data as UpdatePlayerGoalArgs;
        const { isEliminated, eliminatedAt } = data;

        await db.run(
          `UPDATE participants SET is_eliminated = ?, eliminated_at = ? WHERE pact_pubkey = ? AND player_pubkey = ?`,
          [isEliminated, eliminatedAt ? eliminatedAt.toString() : null, challengePactPubkey.toBase58(), playerPubkey.toBase58()]
        );
        console.log(`Player ${playerPubkey.toBase58()} in pact ${challengePactPubkey.toBase58()} updated. Eliminated: ${isEliminated}.`);
        break;
      }
      default:
        console.log('Unhandled instruction:', decoded.name);
    }
  }
}




