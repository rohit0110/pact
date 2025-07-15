use anchor_lang::prelude::*;
use borsh::{BorshDeserialize, BorshSerialize};
declare_id!("HBSRo9sKjWmqTteMRPjVF2xcqratjhF5Hu5GozqctNA4");

#[program]
pub mod pact {
    use super::*;

    pub fn initialize_player_profile(ctx: Context<InitializePlayerProfile>, name: String) -> Result<()> {
        let player_profile = &mut ctx.accounts.player_profile;
        player_profile.owner = ctx.accounts.player.key();
        player_profile.name = name;
        player_profile.active_pacts = Vec::new();
        player_profile.pacts_won = 0;
        player_profile.pacts_lost = 0;
        Ok(())
    }

    pub fn initialize_challenge_pact(ctx: Context<InitializeChallengePact>, name: String, description: String, goal_type: GoalType, goal_value: u64, verification_type: VerificationType, comparison_operator: ComparisonOperator, stake: u64) -> Result<()> {
        let challenge_pact = &mut ctx.accounts.challenge_pact;
        challenge_pact.name = name;
        challenge_pact.description = description;
        challenge_pact.creator = ctx.accounts.player.key();
        challenge_pact.created_at = Clock::get()?.unix_timestamp;
        challenge_pact.status = PactStatus::Initialized;
        challenge_pact.goal_type = goal_type;
        challenge_pact.goal_value = goal_value;
        challenge_pact.verification_type = verification_type;
        challenge_pact.comparison_operator = comparison_operator;
        challenge_pact.stake = stake;
        challenge_pact.prize_pool = 0;
        challenge_pact.participants = Vec::new();
        challenge_pact.participants.push(ctx.accounts.player.key());

        // Calculate the rent-exempt minimum for the vault
        let rent_exemption = Rent::get()?.minimum_balance(0);

        // Create the vault account using a CPI to the system program
        let create_vault_ix = anchor_lang::solana_program::system_instruction::create_account(
            &ctx.accounts.app_vault.key(),
            &ctx.accounts.pact_vault.key(),
            rent_exemption,
            0,
            &anchor_lang::solana_program::system_program::ID,
        );
        anchor_lang::solana_program::program::invoke_signed(
            &create_vault_ix,
            &[
                ctx.accounts.app_vault.to_account_info(),
                ctx.accounts.pact_vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[&[
                b"pact_vault",
                challenge_pact.key().as_ref(),
                &[ctx.bumps.pact_vault],
            ]],
        )?;

        challenge_pact.pact_vault = ctx.accounts.pact_vault.key();
        challenge_pact.pact_vault_bump = ctx.bumps.pact_vault;

        // add PDA of challenge_pact to the player's active pacts
        let player_profile = &mut ctx.accounts.player_profile;
        player_profile.active_pacts.push(challenge_pact.key());

        Ok(())
    }

    pub fn join_challenge_pact(ctx: Context<JoinChallengePact>) -> Result<()> {
        let challenge_pact = &mut ctx.accounts.challenge_pact;
        require!(
            challenge_pact.status == PactStatus::Initialized,
            ErrorCode::PactNotInitialized
        );
        require!(
            !challenge_pact.participants.contains(&ctx.accounts.player.key()),
            ErrorCode::AlreadyJoined
        );
        challenge_pact.participants.push(ctx.accounts.player.key());
        // add PDA of challenge_pact to the player's active pacts
        let player_profile = &mut ctx.accounts.player_profile;
        player_profile.active_pacts.push(challenge_pact.key());
        Ok(())
    }

    pub fn stake_amount_for_challenge_pact(ctx: Context<StakeAmountForChallengePact>, amount: u64) -> Result<()> {
        let challenge_pact = &mut ctx.accounts.challenge_pact;
        require!(
            challenge_pact.status == PactStatus::Initialized,
            ErrorCode::PactNotInitialized
        );
        require!(
            !ctx.accounts.player_goal.has_staked,
            ErrorCode::AlreadyStaked
        );
        require!(amount > 0, ErrorCode::PrizePoolMustBeGreaterThanZero);

        // Transfer the stake amount to the pact vault
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.player.key(),
            &ctx.accounts.pact_vault.key(),
            ctx.accounts.challenge_pact.stake, //right now transferring the stake amount which is common, ideally should be any amount the user wants?
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[ctx.accounts.player.to_account_info(), ctx.accounts.pact_vault.to_account_info()],
        )?;
        ctx.accounts.player_goal.has_staked = true;
        ctx.accounts.challenge_pact.prize_pool += ctx.accounts.challenge_pact.stake;
        Ok(())
    }

    // also do the check if all particpants have staked, if so then start the challenge pact in the frontend
    pub fn start_challenge_pact(ctx: Context<StartChallengePact>) -> Result<()> {
        let challenge_pact = &mut ctx.accounts.challenge_pact;

        require!(
            challenge_pact.status == PactStatus::Initialized,
            ErrorCode::PactNotInitialized
        );
        require!(
            challenge_pact.creator == ctx.accounts.player.key(),
            ErrorCode::NotPactCreator
        );

        // Check all participants have staked
        for participant in challenge_pact.participants.iter() {
            let (player_goal_pda, _) = Pubkey::find_program_address(
                &[
                    b"player_pact_profile",
                    participant.as_ref(),
                    challenge_pact.key().as_ref(),
                ],
                ctx.program_id,
            );

            // Get the matching AccountInfo passed in from the frontend
            let player_goal_info = ctx.remaining_accounts
                .iter()
                .find(|acc| acc.key == &player_goal_pda)
                .ok_or(ErrorCode::MissingPlayerGoal)?;

            let player_goal = PlayerGoalForChallengePact::try_deserialize(&mut &player_goal_info.data.borrow()[..])?;

            require!(player_goal.has_staked, ErrorCode::PlayerNotStaked);
        }

        challenge_pact.status = PactStatus::Active;
        Ok(())
    }
    pub fn end_challenge_pact(ctx: Context<EndChallengePact>) -> Result<()> {
        let challenge_pact = &mut ctx.accounts.challenge_pact;
        require!(
            challenge_pact.status == PactStatus::Active,
            ErrorCode::PactAlreadyCompleted
        );
        challenge_pact.status = PactStatus::Completed;
        // For i in challenge_pact.participants check if player_goal.is_eliminated == false, if so transfer the prize_pool to the player
        // we can use a loop to iterate through the participants and check their goals in PlayerGoalForChallengePact struct with seeds seeds = [b"player_profile", player.key().as_ref(), challenge_pact.key().as_ref()]
        // do the above in frontend and just pass the pubkey of the winner here

        // Transfer the prize pool to the winner, take a small cut from the prize pool for the app vault
        let app_cut = challenge_pact.prize_pool / 100; // 1% cut for the app vault
        let winner_cut = challenge_pact.prize_pool - app_cut;

        //vault seeds
        let challenge_pact_key = challenge_pact.key();
        let vault_seeds = &[
            b"pact_vault".as_ref(),
            challenge_pact_key.as_ref(),
            &[challenge_pact.pact_vault_bump],
        ];

        // Transfer the app cut to the app vault
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.pact_vault.key(),
            &ctx.accounts.app_vault.key(),
            app_cut,
        );
        anchor_lang::solana_program::program::invoke_signed(
            &ix,
            &[ctx.accounts.pact_vault.to_account_info(), ctx.accounts.app_vault.to_account_info()],
            &[vault_seeds]
        )?;

        // transfer winner cut to the winner
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.pact_vault.key(),
            &ctx.accounts.winner.key(),
            winner_cut,
        );
        anchor_lang::solana_program::program::invoke_signed(
            &ix,
            &[ctx.accounts.pact_vault.to_account_info(), ctx.accounts.winner.to_account_info()],
            &[vault_seeds]
        )?;
        // Update the player profile of the winner
        
        // Update the player profile of the loser
        
        Ok(())
    }

    pub fn update_player_goal(ctx: Context<UpdatePlayerGoal>, is_eliminated: bool, eliminated_at: Option<i64>) -> Result<()> {
        let player_goal = &mut ctx.accounts.player_goal;
        player_goal.is_eliminated = is_eliminated;
        player_goal.eliminated_at = eliminated_at;
        Ok(())
    }
}

// CONTEXTS----------------------------------------------------
#[derive(Accounts)]
pub struct InitializePlayerProfile<'info> {
    #[account(
        init,
        payer = app_vault,
        space = 8 + PlayerProfile::INIT_SPACE,
        seeds = [b"player_profile", player.key().as_ref()],
        bump
    )]
    pub player_profile: Account<'info,PlayerProfile>,
    #[account(mut)]
    pub app_vault: Signer<'info>,
    /// CHECK: Player account is used as a seed for the player profile PDA.
    pub player: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializeChallengePact<'info> {
    #[account(
        init,
        payer = app_vault,
        space = 8 + ChallengePact::INIT_SPACE,
        seeds = [b"challenge_pact", name.as_bytes(), player.key().as_ref()],
        bump
    )]
    pub challenge_pact: Account<'info, ChallengePact>,
    #[account(
        init,
        payer = app_vault,
        seeds = [b"player_pact_profile", player.key().as_ref(), challenge_pact.key().as_ref()],
        space = 8 + PlayerGoalForChallengePact::INIT_SPACE,
        bump
    )]
    pub player_goal: Account<'info, PlayerGoalForChallengePact>,
    #[account(
        mut,
        seeds = [b"pact_vault", challenge_pact.key().as_ref()],
        bump,
    )]
    pub pact_vault: SystemAccount<'info>,
    #[account(mut)]
    pub app_vault: Signer<'info>,
    #[account(
        mut,
        seeds = [b"player_profile", player.key().as_ref()],
        bump
        )]
    pub player_profile: Account<'info, PlayerProfile>,
    /// CHECK: Player account is the creator of the pact and need key to match to creator to initialize it.
    pub player: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinChallengePact<'info> {
    #[account(mut)]
    pub challenge_pact: Account<'info, ChallengePact>,
    #[account(
        init,
        payer = app_vault,
        space = 8 + PlayerGoalForChallengePact::INIT_SPACE,
        seeds = [b"player_pact_profile", player.key().as_ref(), challenge_pact.key().as_ref()],
        bump
    )]
    pub player_goal: Account<'info, PlayerGoalForChallengePact>,
    #[account(mut)]
    pub app_vault: Signer<'info>,
    #[account(
        mut,
        seeds = [b"player_profile", player.key().as_ref()],
        bump,
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    /// CHECK: Player account is used as a seed for the player goal PDA.
    pub player: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakeAmountForChallengePact<'info> {
    #[account(mut)]
    pub challenge_pact: Account<'info, ChallengePact>,
    #[account(
        mut,
        seeds = [b"player_pact_profile", player.key().as_ref(), challenge_pact.key().as_ref()],
        bump
    )]
    pub player_goal: Account<'info, PlayerGoalForChallengePact>,
    #[account(
        mut,
        seeds = [b"pact_vault", challenge_pact.key().as_ref()],
        bump,
    )]
    pub pact_vault: SystemAccount<'info>,
    /// CHECK: App vault pays the gas fees
    pub app_vault: AccountInfo<'info>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StartChallengePact<'info> {
    #[account(mut)]
    pub challenge_pact: Account<'info, ChallengePact>,
    #[account(mut)]
    pub app_vault: Signer<'info>,
    /// CHECK: Player account is the creator of the pact and need key to match to creator to start it.
    pub player: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EndChallengePact<'info> {
    #[account(
        mut,
    )]
    pub challenge_pact: Account<'info, ChallengePact>,
    #[account(
        mut,
        seeds = [b"pact_vault", challenge_pact.key().as_ref()],
        bump,
    )]
    pub pact_vault: SystemAccount<'info>,
    #[account(mut)]
    /// CHECK: winner gets lamports; no data is read or written
    pub winner: AccountInfo<'info>,
    #[account(mut)]
    pub app_vault: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePlayerGoal<'info> {
    #[account(
        mut,
        seeds = [b"player_pact_profile", player.key().as_ref(), challenge_pact.key().as_ref()],
        bump
    )]
    pub player_goal: Account<'info, PlayerGoalForChallengePact>,
    #[account(mut)]
    pub challenge_pact: Account<'info, ChallengePact>,
    #[account(mut)]
    pub app_vault: Signer<'info>,
    /// CHECK: Player account is used as a seed for the player goal PDA.
    pub player: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}
// STATE----------------------------------------------------
#[account]
#[derive(Default, Debug, PartialEq, InitSpace)]
pub struct ChallengePact {
    #[max_len(32)]
    pub name: String,
    #[max_len(32)]
    pub description: String,
    pub creator: Pubkey,
    pub created_at: i64,
    #[max_len(10)]
    pub participants: Vec<Pubkey>,
    pub status: PactStatus,
    pub goal_type: GoalType,
    pub goal_value: u64, 
    pub verification_type: VerificationType,
    pub comparison_operator: ComparisonOperator,
    pub stake: u64,
    pub prize_pool: u64,
    pub pact_vault: Pubkey,
    pub pact_vault_bump: u8,
}

#[account]
#[derive(Default, Debug, PartialEq, InitSpace)]
pub struct PlayerProfile {
    pub owner: Pubkey,
    #[max_len(32)]
    pub name: String,
    #[max_len(10)]
    pub active_pacts: Vec<Pubkey>,
    pub pacts_won: u64,
    pub pacts_lost: u64
}

#[account]
#[derive(Default, Debug, PartialEq, InitSpace)]
pub struct PlayerGoalForChallengePact {
    pub player: Pubkey,
    pub pact: Pubkey,
    pub has_staked: bool,
    pub is_eliminated: bool,
    pub eliminated_at: Option<i64>, // Timestamp when eliminated
}

// ENUMS-----------------------------------------------------------------------
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq, InitSpace)]
pub enum PactStatus {
    Initialized, // People be joining the pact
    Active, // Pact gets started
    Completed,
    Cancelled,
}

impl Default for PactStatus {
    fn default() -> Self {
        PactStatus::Initialized
    }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq, InitSpace)]
pub enum GoalType {
    // Fitness Goals
    DailySteps,                  // Apple Health / Google Fit
    DailyRunKm,                  // Apple Health / Strava
    DailyCaloriesBurned,         // Apple Health / Google Fit
    
    // Digital Wellness
    DailyScreenTimeMax,          // Screen Time API (less than X minutes)
    DailyPhonePickupsMax,        // Screen Time API (less than X times)
    
    // Coding Goals
    DailyGithubContribution,      // GitHub API (green squares)
    DailyLeetCodeProblems,       // LeetCode API (scraping)
    
    // Cumulative Goals
    TotalSteps,                  // Total steps in period
    TotalCaloriesBurned,         // Total calories burned in period
    TotalDistanceKm,             // Total distance in period
    TotalLeetCodeSolved,         // Total problems in period
}

impl Default for GoalType {
    fn default() -> Self {
        GoalType::DailySteps
    }
}

#[derive(AnchorSerialize, Debug, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum VerificationType {
    ScreenTime,
    GitHubAPI,
    LeetCodeScrape,
    Strava,
}

impl Default for VerificationType {
    fn default() -> Self {
        VerificationType::ScreenTime
    }
}

#[derive(AnchorSerialize, Debug, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum ComparisonOperator {
    GreaterThanOrEqual,  // Steps >= 10000
    LessThanOrEqual,     // ScreenTime <= 120 minutes
}

impl Default for ComparisonOperator {
    fn default() -> Self {
        ComparisonOperator::GreaterThanOrEqual
    }
}

// ERROR CODES-------------------------------------------------
#[error_code]
pub enum ErrorCode {
    #[msg("Pact is not initialized")]
    PactNotInitialized,
    #[msg("Player has already joined this pact")]
    AlreadyJoined,
    #[msg("Player is not the creator of this pact")]
    NotPactCreator,
    #[msg("Player is not a participant in this pact")]
    NotParticipant,
    #[msg("Pact is already active")]
    PactAlreadyActive,
    #[msg("Pact is already completed")]
    PactAlreadyCompleted,
    #[msg("Pact is already cancelled")]
    PactAlreadyCancelled,
    #[msg("Invalid goal type for this pact")]
    InvalidGoalType,
    #[msg("Invalid verification type for this pact")]
    InvalidVerificationType,
    #[msg("Invalid comparison operator for this pact")]
    InvalidComparisonOperator,
    #[msg("Prize pool must be greater than zero")]
    PrizePoolMustBeGreaterThanZero,
    #[msg("Player has already staked in this pact")]
    AlreadyStaked,
    #[msg("Player has not staked yet.")]
    PlayerNotStaked,
    #[msg("Missing PlayerGoal account for a participant.")]
    MissingPlayerGoal,
}