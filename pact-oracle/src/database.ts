import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database<sqlite3.Database, sqlite3.Statement>;

/**
 * Opens a connection to the SQLite database and creates tables if they don't exist.
 * @returns {Promise<Database>} The database connection object.
 */
export async function openDb(): Promise<Database> {
  if (db) {
    return db;
  }

  db = await open({
    filename: './pact_data.db',
    driver: sqlite3.Database,
  });

  console.log('Connected to the SQLite database.');

  // Use serialize to run one statement at a time
  await db.exec(`
    CREATE TABLE IF NOT EXISTS pacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pubkey TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      creator TEXT NOT NULL,
      status TEXT NOT NULL,
      stake_amount INTEGER,
      prize_pool INTEGER,
      created_at INTEGER,
      code TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS player_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pubkey TEXT UNIQUE NOT NULL,
      name TEXT,
      pacts_won INTEGER DEFAULT 0,
      pacts_lost INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS participants (
        pact_pubkey TEXT NOT NULL,
        player_pubkey TEXT NOT NULL,
        has_staked BOOLEAN DEFAULT FALSE,
        is_eliminated BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (pact_pubkey, player_pubkey),
        FOREIGN KEY (pact_pubkey) REFERENCES pacts(pubkey),
        FOREIGN KEY (player_pubkey) REFERENCES player_profiles(pubkey)
    );
  `);

  console.log('Database tables are ready.');
  return db;
}
