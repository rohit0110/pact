import dotenv from 'dotenv';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import bs58 from 'bs58';
import { openDb } from '../database';
import { runIndexer } from '../indexer';
import { IDL, Pact } from '../idl/idl';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
import { verifyGithubForPlayer } from '../verifiers/github';

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
 */
export async function runIndexerAndShit() {
  try {
    const connection = getSolanaConnection();
    const appVaultKeypair = getAppVaultKeypair();
    const wallet = new Wallet(appVaultKeypair);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    const program = new Program<Pact>(IDL, process.env.PROGRAM_ID!, provider);
    await runIndexer(connection, program);
  } catch (error) {
    console.error('Error in runIndexerAndShit:', error);
  } 
}

export async function runHourlyCheck() {
  console.log('Running hourly GitHub check...');
  try {
    const connection = getSolanaConnection();
    const appVaultKeypair = getAppVaultKeypair();
    const wallet = new Wallet(appVaultKeypair);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    const program = new Program<Pact>(IDL, process.env.PROGRAM_ID!, provider);

    // Step 1: Run the indexer to sync on-chain data to the local DB
    await runIndexer(connection, program);

    // Step 2: Perform the oracle checks using the now-synced data
    console.log('Starting GitHub oracle checks...');
    const db = await openDb();
    const activePacts = await db.all("SELECT * FROM pacts WHERE status = 'active'");
    console.log(`Found ${activePacts.length} active pacts for GitHub check.`);

    for (const pact of activePacts) {
      console.log(`Checking pact: ${pact.name}`);
      console.log(`Pact goal type: ${pact.goal_type}`);
      if (pact.goal_type === 'dailyGithubContribution') {
        const participants = await db.all('SELECT * FROM participants WHERE pact_pubkey = ? AND is_eliminated = 0', [pact.pubkey]);
        console.log(`Found ${participants.length} non-eliminated participants for pact ${pact.name}.`);

        for (const participant of participants) {
          // Skip if participant is already eliminated
          if (participant.is_eliminated) {
            console.log(`Player ${participant.player_pubkey} is already eliminated in pact ${pact.name}. Skipping.`);
            continue;
          }

          const playerProfile = await db.get('SELECT * FROM player_profiles WHERE pubkey = ?', [participant.player_pubkey]);

          if (playerProfile && playerProfile.github_username) {
            const isVerified = await verifyGithubForPlayer(playerProfile.github_username, pact.goal_value);

            if (!isVerified) {
              console.log(`Player ${playerProfile.name} failed the goal for pact ${pact.name}. Updating status...`);
              const [playerGoalPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("player_pact_profile"), new PublicKey(participant.player_pubkey).toBuffer() ,new PublicKey(pact.pubkey).toBuffer()],
                program.programId
              );

              const transaction = await program.methods
                .updatePlayerGoal(true, new BN(Date.now()))
                .accounts({
                  playerGoal: playerGoalPDA,
                  challengePact: new PublicKey(pact.pubkey),
                  appVault: appVaultKeypair.publicKey,
                  player: new PublicKey(participant.player_pubkey),
                  systemProgram: SystemProgram.programId,
                })
                .transaction();
              
              transaction.feePayer = appVaultKeypair.publicKey;
              const { blockhash } = await connection.getLatestBlockhash();
              transaction.recentBlockhash = blockhash;

              transaction.partialSign(appVaultKeypair);
              const signature = await connection.sendRawTransaction(transaction.serialize());
              await connection.confirmTransaction(signature, 'confirmed');
              console.log(`Player ${playerProfile.name} marked as eliminated. Signature: ${signature}`);

              // Update local database after successful transaction
              await db.run(
                'UPDATE participants SET is_eliminated = ?, eliminated_at = ? WHERE pact_pubkey = ? AND player_pubkey = ?',
                [true, Date.now(), pact.pubkey, participant.player_pubkey]
              );
            }
          }
        }
      }
    }

    console.log('Hourly GitHub check completed successfully.');
  } catch (error) {
    console.error('Error during hourly GitHub check:', error);
  }
}

export async function runEndOfDayCheck() {
  console.log('Running end-of-day pact check...');
  try {
    const connection = getSolanaConnection();
    const appVaultKeypair = getAppVaultKeypair();
    const wallet = new Wallet(appVaultKeypair);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    const program = new Program<Pact>(IDL, process.env.PROGRAM_ID!, provider);

    const db = await openDb();
    const activePacts = await db.all("SELECT * FROM pacts WHERE status = 'active'");
    console.log(`Found ${activePacts.length} active pacts for end-of-day check.`);

    for (const pact of activePacts) {
      // Skip if pact is already completed
      if (pact.status === 'completed') {
        console.log(`Pact ${pact.name} is already completed. Skipping.`);
        continue;
      }

      const nonEliminatedParticipants = await db.all(
        'SELECT * FROM participants WHERE pact_pubkey = ? AND is_eliminated = 0',
        [pact.pubkey]
      );

      if (nonEliminatedParticipants.length <= 1) {
        console.log(`Pact ${pact.name} has ${nonEliminatedParticipants.length} non-eliminated participants. Ending pact...`);
        
        let winnerPubkey: PublicKey | undefined;
        if (nonEliminatedParticipants.length === 1) {
          winnerPubkey = new PublicKey(nonEliminatedParticipants[0].player_pubkey);
        } else {
          // If 0 participants, no winner. The smart contract should handle this case.
          // For now, we'll just use the appVault as a placeholder if no winner, though this might need refinement.
          winnerPubkey = appVaultKeypair.publicKey; 
        }

        const [pactVaultPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("pact_vault"), new PublicKey(pact.pubkey).toBuffer()],
          program.programId
        );

        const transaction = await program.methods
          .endChallengePact()
          .accounts({
            challengePact: new PublicKey(pact.pubkey),
            pactVault: pactVaultPDA,
            winner: winnerPubkey,
            appVault: appVaultKeypair.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .transaction();

        transaction.feePayer = appVaultKeypair.publicKey;
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        transaction.partialSign(appVaultKeypair);
        const signature = await connection.sendRawTransaction(transaction.serialize());
        await connection.confirmTransaction(signature, 'confirmed');
        console.log(`Pact ${pact.name} ended. Signature: ${signature}`);

        // Update local database after successful transaction
        await db.run(
          'UPDATE pacts SET status = ? WHERE pubkey = ?',
          ['completed', pact.pubkey]
        );
      }
    }

    console.log('End-of-day pact check completed successfully.');
  } catch (error) {
    console.error('Error during end-of-day pact check:', error);
  }
}