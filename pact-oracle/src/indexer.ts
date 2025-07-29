import { Connection } from '@solana/web3.js';
import { openDb } from './database';
import { Program } from '@coral-xyz/anchor';
import { Pact } from './idl/idl';

/**
 * Fetches all pact-related accounts from the blockchain and updates the local database.
 * @param connection The Solana connection object.
 * @param program The Anchor program instance for your smart contract.
 */

export async function runIndexer(connection: Connection, program: Program<Pact>) {
  console.log('🔁 Starting indexer run...');
  const db = await openDb();

  // Use a single transaction for the entire indexing run for atomicity
  await db.run('BEGIN TRANSACTION');
  try {
    // === 1. Index ChallengePacts ===
    // This step now ONLY handles the pacts table.
    console.log('Indexing pacts...');
    const allPacts = await program.account.challengePact.all();
    for (const pact of allPacts) {
      const { name, description, creator, status, stake, prizePool, createdAt } = pact.account;
      await db.run(
        `INSERT INTO pacts (pubkey, name, description, creator, status, stake_amount, prize_pool, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(pubkey) DO UPDATE SET
           name=excluded.name,
           description=excluded.description,
           creator=excluded.creator,
           status=excluded.status,
           stake_amount=excluded.stake_amount,
           prize_pool=excluded.prize_pool,
           created_at=excluded.created_at`,
        [
          pact.publicKey.toBase58(),
          name,
          description,
          creator.toBase58(),
          Object.keys(status)[0],
          stake.toNumber(),
          prizePool.toNumber(),
          createdAt.toNumber(),
        ]
      );
    }

    // === 2. Index PlayerProfiles ===
    // This step populates/updates the player_profiles table.
    console.log('Indexing player profiles...');
    const allProfiles = await program.account.playerProfile.all();
    for (const profile of allProfiles) {
        const { owner, name, pactsWon, pactsLost } = profile.account;
        // Use INSERT OR IGNORE for new players, then UPDATE to ensure data is fresh.
        await db.run(`INSERT OR IGNORE INTO player_profiles (pubkey) VALUES (?)`, owner.toBase58());
        await db.run(
            `UPDATE player_profiles SET name = ?, pacts_won = ?, pacts_lost = ? WHERE pubkey = ?`,
            name, pactsWon.toNumber(), pactsLost.toNumber(), owner.toBase58()
        );
    }

    // === 3. Index PlayerGoals (Authoritative step for participants) ===
    // This step now creates and updates the participants table, as it has the most complete data.
    console.log('Indexing player goals and participants...');
    const allPlayerGoals = await program.account.playerGoalForChallengePact.all();
    for (const playerGoal of allPlayerGoals) {
        const { player, pact, hasStaked, isEliminated } = playerGoal.account;
        console.log(playerGoal);
        // Using INSERT OR REPLACE is more robust than separate INSERT/UPDATE.
        
        await db.run(
            `INSERT OR REPLACE INTO participants (pact_pubkey, player_pubkey, has_staked, is_eliminated)
             VALUES (?, ?, ?, ?)`, 
            pact.toBase58(), 
            player.toBase58(),
            hasStaked ? 1 : 0, 
            isEliminated ? 1 : 0
        );
    }

    await db.run('COMMIT');
    console.log('✅ Indexer run completed successfully.');
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('❌ Error during indexer run, transaction rolled back:', error);
  }
}
