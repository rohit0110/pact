# Pact Protocol: Smart Contract Integration Guide

## 1. Project Overview & Achievements

We have successfully developed and tested a robust smart contract on the Solana blockchain for creating and managing time-based challenge pacts. The core logic allows users to create challenges, join them, stake funds, and have a winner-take-all (minus a small fee) prize pool distributed at the end.

**Core Features Implemented:**
*   **Player Profiles:** Users can create a persistent on-chain profile to track their pact history (`pacts_won`, `pacts_lost`).
*   **Pact Creation & Management:** A full lifecycle for pacts is supported, from initialization and joining to starting and completion.
*   **On-Chain Vaults:** Each pact has its own secure vault (a Program-Derived Address, or PDA) to hold staked funds.
*   **Staking:** Participants can stake a predetermined amount of SOL into the pact's vault.
*   **Winner Payout:** A function exists to end the pact and distribute the prize pool to a designated winner, with a 1% commission sent to the app's vault.
*   **State Management:** The contract tracks the status of each pact (`Initialized`, `Active`, `Completed`) and each participant's status within a pact (`has_staked`, `is_eliminated`).

---

## 2. Key Information for Frontend Integration

#### Program ID
The smart contract is deployed on the local test validator with the following Program ID. This is the entry point for all interactions.
**Program ID:** `HBSRo9sKjWmqTteMRPjVF2xcqratjhF5Hu5GozqctNA4`

#### Core Data Structures (Accounts)
Your front end will primarily interact with three types of on-chain accounts. You will need to fetch and deserialize their data to display UI components.

1.  **`ChallengePact`**: The central account for a pact.
    *   **Key Fields:** `name`, `description`, `creator`, `status`, `stake`, `prize_pool`, `participants` (a `Vec<Pubkey>`).
    *   **How to Find:** It's a PDA. You can derive its address using the seeds: `[b"challenge_pact", name, creator_pubkey]`.

2.  **`PlayerProfile`**: A user's global profile.
    *   **Key Fields:** `owner`, `name`, `active_pacts`, `pacts_won`, `pacts_lost`.
    *   **How to Find:** It's a PDA derived from the user's public key: `[b"player_profile", user_pubkey]`.

3.  **`PlayerGoalForChallengePact`**: Links a player to a specific pact, tracking their status.
    *   **Key Fields:** `player`, `pact`, `has_staked`, `is_eliminated`.
    *   **How to Find:** It's a PDA derived from the player's key and the pact's key: `[b"player_pact_profile", user_pubkey, challenge_pact_pubkey]`.

---

## 3. User Flow & Instruction Guide

Here is the sequence of instructions you will need to call to implement the full user flow.

#### Step 1: Initialize Player Profile
*   **Purpose:** Creates a new profile for a first-time user.
*   **Instruction:** `initializePlayerProfile(name: String)`
*   **Accounts Needed:**
    *   `playerProfile`: PDA from `[b"player_profile", user.publicKey]`
    *   `player`: The user's public key.
    *   `appVault`: The app's central wallet public key.
    *   `systemProgram`: `anchor.web3.SystemProgram.programId`
*   **Signer:** The `app_vault` keypair (pays for account creation).

#### Step 2: Create a Challenge Pact
*   **Purpose:** A user creates a new pact for others to join.
*   **Instruction:** `initializeChallengePact(name, description, goal_type, ...)`
*   **Accounts Needed:**
    *   `challengePact`: PDA from `[b"challenge_pact", name, user.publicKey]`
    *   `playerGoal`: PDA from `[b"player_pact_profile", user.publicKey, challengePactPDA]`
    *   `pactVault`: PDA from `[b"pact_vault", challengePactPDA]`
    *   `playerProfile`: PDA from `[b"player_profile", user.publicKey]`
    *   `player`: The user's public key.
    *   `appVault`: The app's central wallet public key.
*   **Signer:** The `app_vault` keypair.

#### Step 3: Join a Pact
*   **Purpose:** A different user joins an existing pact.
*   **Instruction:** `joinChallengePact()`
*   **Accounts Needed:**
    *   `challengePact`: The PDA of the pact they are joining.
    *   `playerGoal`: A *new* PDA for this user: `[b"player_pact_profile", joiner.publicKey, challengePactPDA]`
    *   `playerProfile`: The joiner's profile PDA: `[b"player_profile", joiner.publicKey]`
    *   `player`: The joiner's public key.
    *   `appVault`: The app's central wallet public key.
*   **Signer:** The `app_vault` keypair.

#### Step 4: Stake Funds
*   **Purpose:** A participant stakes the required amount into the vault. **This must be done by every participant.**
*   **Instruction:** `stakeAmountForChallengePact(amount: u64)`
*   **Accounts Needed:**
    *   `challengePact`: The pact's PDA.
    *   `pactVault`: The pact's vault PDA.
    *   `playerGoal`: The staker's goal PDA for this pact.
    *   `player`: The staker's public key.
*   **Signer:** The **player's** keypair (they are sending their own SOL).

#### Step 5: Start the Pact
*   **Purpose:** The creator officially begins the challenge for all participants.
*   **Instruction:** `startChallengePact()`
*   **Accounts Needed:**
    *   `challengePact`: The pact's PDA.
    *   `player`: The creator's public key.
    *   `appVault`: The app's central wallet public key.
*   **Signer:** The `app_vault` keypair.
*   **!! CRITICAL !! - `remainingAccounts`:**
    *   This instruction requires you to pass the public keys of **every single `PlayerGoalForChallengePact` account** for all participants in the `remainingAccounts` array of the transaction.
    *   **Frontend Logic:** You must first fetch the `challengePact` account, loop through its `participants` array, derive each participant's `playerGoal` PDA, and add them to this list.

#### Step 6: End the Pact
*   **Purpose:** Concludes the pact and distributes the prize pool.
*   **Instruction:** `endChallengePact()`
*   **Accounts Needed:**
    *   `challengePact`: The pact's PDA.
    *   `pactVault`: The pact's vault PDA.
    *   `winner`: The public key of the winning player.
    *   `appVault`: The app's central wallet public key.
*   **Signer:** The `app_vault` keypair.
*   **Frontend Logic:** Your application must first determine the winner off-chain. The contract does not contain logic to evaluate who won; it simply executes the payout to the `winner` you provide.

---

## 4. Off-Chain Considerations & The Oracle Problem

*   **Goal Verification (`update_player_goal`):** The contract has no access to real-world data (like Apple Health, GitHub, etc.). The function `update_player_goal` exists to set a player's `is_eliminated` status, but the contract itself will never call it.
*   **Your Responsibility:** You will need a trusted, off-chain backend service (an "oracle") that:
    1.  Fetches data from external APIs (e.g., Strava).
    2.  Determines if a user has failed their goal.
    3.  Calls the `update_player_goal` instruction to mark that user as eliminated on-chain.
*   **Winner Determination:** Similarly, the front end or a backend service is responsible for looking at all `PlayerGoalForChallengePact` accounts at the end of a pact, finding who is *not* eliminated, and then calling `end_challenge_pact` with the correct winner's public key.
