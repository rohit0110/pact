import { Pact } from '../types';

const BASE_URL = 'http://localhost:3000/api'; // Assuming your oracle server runs on port 3000

/**
 * Fetches all pacts from the indexer service.
 * @returns {Promise<Array<Pact>>} A promise that resolves to an array of pacts.
 */
export const getPacts = async (): Promise<Pact[]> => {
  try {
    const response = await fetch(`${BASE_URL}/pacts`);
    if (!response.ok) {
      throw new Error('Failed to fetch pacts');
    }
    const pacts: Pact[] = await response.json();
    return pacts;
  } catch (error) {
    console.error('Error fetching pacts:', error);
    return []; // Return an empty array on error
  }
};

/**
 * Fetches all pacts for a specific player.
 * @param {string} pubkey The public key of the player.
 * @returns {Promise<Array<Pact>>} A promise that resolves to an array of pacts.
 */
export const getPlayerPacts = async (pubkey: string): Promise<Pact[]> => {
  try {
    const response = await fetch(`${BASE_URL}/players/${pubkey}/pacts`);
    if (!response.ok) {
      throw new Error(`Failed to fetch pacts for player ${pubkey}`);
    }
    const pacts: Pact[] = await response.json();
    return pacts;
  } catch (error) {
    console.error(`Error fetching pacts for player ${pubkey}:`, error);
    return [];
  }
};
