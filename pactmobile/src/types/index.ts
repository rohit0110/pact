export interface Pact {
  pubkey: string;
  name: string;
  description: string;
  status: 'Initialized' | 'Active' | 'Completed' | 'Cancelled';
  stake_amount: number;
  prize_pool: number;
  created_at: number;
}

export interface PlayerProfile {
  pubkey: string;
  name: string;
  pacts_won: number;
  pacts_lost: number;
}

export interface Participant {
  pact_pubkey: string;
  player_pubkey: string;
  has_staked: boolean;
  is_eliminated: boolean;
}
