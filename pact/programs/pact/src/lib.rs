use anchor_lang::prelude::*;

declare_id!("HBSRo9sKjWmqTteMRPjVF2xcqratjhF5Hu5GozqctNA4");

#[program]
pub mod pact {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
