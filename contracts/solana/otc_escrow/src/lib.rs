// Solana OTC Escrow Contract (Anchor Framework)
// Deploy cost: ~0.02 SOL ($4-5) one-time

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("YOUR_PROGRAM_ID_HERE"); // Will be generated on deployment

#[program]
pub mod otc_escrow {
    use super::*;

    /// Create a new OTC order with escrow
    pub fn create_order(
        ctx: Context<CreateOrder>,
        order_id: u64,
        amount_offer: u64,
        token_wanted: Pubkey,
        amount_wanted: u64,
    ) -> Result<()> {
        let order = &mut ctx.accounts.order;
        order.maker = ctx.accounts.maker.key();
        order.order_id = order_id;
        order.token_offer = ctx.accounts.token_offer_account.mint;
        order.amount_offer = amount_offer;
        order.token_wanted = token_wanted;
        order.amount_wanted = amount_wanted;
        order.is_active = true;
        order.bump = *ctx.bumps.get("order").unwrap();

        // Transfer tokens to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.maker_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.maker.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount_offer)?;

        Ok(())
    }

    /// Execute OTC swap
    pub fn execute_order(ctx: Context<ExecuteOrder>) -> Result<()> {
        let order = &ctx.accounts.order;
        require!(order.is_active, ErrorCode::OrderNotActive);

        // Transfer wanted tokens from taker to maker
        let cpi_accounts_to_maker = Transfer {
            from: ctx.accounts.taker_token_account.to_account_info(),
            to: ctx.accounts.maker_wanted_account.to_account_info(),
            authority: ctx.accounts.taker.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program.clone(), cpi_accounts_to_maker);
        token::transfer(cpi_ctx, order.amount_wanted)?;

        // Transfer escrowed tokens to taker using PDA signer
        let seeds = &[
            b"order",
            order.maker.as_ref(),
            &order.order_id.to_le_bytes()[..],
            &[order.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts_to_taker = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.taker_offer_account.to_account_info(),
            authority: ctx.accounts.order.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts_to_taker, signer);
        token::transfer(cpi_ctx, order.amount_offer)?;

        // Mark order as inactive
        let order = &mut ctx.accounts.order;
        order.is_active = false;

        Ok(())
    }

    /// Cancel order and return tokens to maker
    pub fn cancel_order(ctx: Context<CancelOrder>) -> Result<()> {
        let order = &ctx.accounts.order;
        require!(order.is_active, ErrorCode::OrderNotActive);
        require!(order.maker == ctx.accounts.maker.key(), ErrorCode::Unauthorized);

        // Return tokens to maker using PDA signer
        let seeds = &[
            b"order",
            order.maker.as_ref(),
            &order.order_id.to_le_bytes()[..],
            &[order.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.maker_token_account.to_account_info(),
            authority: ctx.accounts.order.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, order.amount_offer)?;

        // Mark order as inactive
        let order = &mut ctx.accounts.order;
        order.is_active = false;

        Ok(())
    }
}

// ─── Account Contexts ───────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct CreateOrder<'info> {
    #[account(
        init,
        payer = maker,
        space = 8 + Order::LEN,
        seeds = [b"order", maker.key().as_ref(), &order_id.to_le_bytes()],
        bump
    )]
    pub order: Account<'info, Order>,

    #[account(mut)]
    pub maker: Signer<'info>,

    #[account(mut)]
    pub maker_token_account: Account<'info, TokenAccount>,

    pub token_offer_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = maker,
        seeds = [b"escrow", order.key().as_ref()],
        bump,
        token::mint = token_offer_account.mint,
        token::authority = order
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ExecuteOrder<'info> {
    #[account(mut, seeds = [b"order", order.maker.as_ref(), &order.order_id.to_le_bytes()], bump = order.bump)]
    pub order: Account<'info, Order>,

    #[account(mut)]
    pub taker: Signer<'info>,

    #[account(mut)]
    pub taker_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub taker_offer_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub maker_wanted_account: Account<'info, TokenAccount>,

    #[account(mut, seeds = [b"escrow", order.key().as_ref()], bump)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelOrder<'info> {
    #[account(mut, seeds = [b"order", order.maker.as_ref(), &order.order_id.to_le_bytes()], bump = order.bump)]
    pub order: Account<'info, Order>,

    #[account(mut)]
    pub maker: Signer<'info>,

    #[account(mut)]
    pub maker_token_account: Account<'info, TokenAccount>,

    #[account(mut, seeds = [b"escrow", order.key().as_ref()], bump)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ─── Data Structures ────────────────────────────────────────────────────────

#[account]
pub struct Order {
    pub maker: Pubkey,          // 32 bytes
    pub order_id: u64,          // 8 bytes
    pub token_offer: Pubkey,    // 32 bytes
    pub amount_offer: u64,      // 8 bytes
    pub token_wanted: Pubkey,   // 32 bytes
    pub amount_wanted: u64,     // 8 bytes
    pub is_active: bool,        // 1 byte
    pub bump: u8,               // 1 byte
}

impl Order {
    pub const LEN: usize = 32 + 8 + 32 + 8 + 32 + 8 + 1 + 1;
}

// ─── Errors ─────────────────────────────────────────────────────────────────

#[error_code]
pub enum ErrorCode {
    #[msg("Order is not active")]
    OrderNotActive,
    #[msg("Unauthorized")]
    Unauthorized,
}
