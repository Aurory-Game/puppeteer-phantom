use anchor_lang::prelude::*;

declare_id!("yfetrhfXx3VBdhx31PkxySB54xX53LXt9S3NrD44pAf");

#[program]
pub mod example {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, bump: u8) -> ProgramResult {
        let counter = &mut ctx.accounts.counter.load_init()?;
        counter.user = *ctx.accounts.user.key;
        counter.bump = bump;
        counter.count = 0;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> ProgramResult {
        let counter = &mut ctx.accounts.counter.load_mut()?;
        counter.count += 1;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 41, seeds = [b"counter".as_ref(), user.to_account_info().key.as_ref()], bump = bump)]
    pub counter: AccountLoader<'info, Counter>,
    pub user: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, seeds = [b"counter".as_ref(), counter.load()?.user.as_ref()], bump = counter.load()?.bump)]
    pub counter: AccountLoader<'info, Counter>,
}

#[account(zero_copy)]
#[derive(PartialEq, Default, Debug)]
pub struct Counter {
    pub user: Pubkey, // 32
    pub bump: u8, // 1
    pub count: u64, // 8
}