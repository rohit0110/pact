import { Connection } from '@solana/web3.js';
import { openDb } from './database';
// import { Program } from '@coral-xyz/anchor'; // Assuming anchor is set up

/**
 * Fetches all pact-related accounts from the blockchain and updates the local database.
 * @param connection The Solana connection object.
 * @param program The Anchor program instance for your smart contract.
 */
export async function runIndexer(connection: Connection, program: any /* anchor.Program<Pact> */) {
  console.log('Starting indexer run...');
  const db = await openDb();

  // TODO: Fetch all 'ChallengePact' accounts from the blockchain
  const allPacts = await program.account.challengePact.all();
  // const allPacts: any[] = []; // Placeholder

  // Use a transaction to ensure atomicity
  await db.run('BEGIN TRANSACTION');
  try {
    for (const pact of allPacts) {
      // TODO: Map the on-chain pact data to the database schema
      const { pubkey, name, description, creator, status, stake, prizePool, createdAt, participants } = pact.account;

      // Upsert the pact data (insert or replace)
      await db.run(
        `INSERT OR REPLACE INTO pacts (pubkey, name, description, creator, status, stake_amount, prize_pool, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
         pact.publicKey.toBase58(), 
         name, 
         description, 
         creator.toBase58(), 
         Object.keys(status)[0], 
         stake.toNumber(), 
         prizePool.toNumber(), 
         createdAt.toNumber()
      );
      console.log(Object.keys(status)[0]);
      for (const participantKey of participants) {
        // Upsert participant data
        await db.run(
          `INSERT OR IGNORE INTO players (pubkey) VALUES (?)`,
          participantKey.toBase58()
        );
        await db.run(
          `INSERT OR IGNORE INTO participants (pact_pubkey, player_pubkey) VALUES (?, ?)`,
          pact.publicKey.toBase58(), participantKey.toBase58()
        );
      }
    }
    await db.run('COMMIT');
    console.log('Indexer run completed successfully.');
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error during indexer run, transaction rolled back:', error);
  }
}
