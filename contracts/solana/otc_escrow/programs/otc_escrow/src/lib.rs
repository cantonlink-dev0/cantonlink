// Solana OTC Escrow Contract (Anchor Framework)
// Deploy cost: ~1.86 SOL (rent-exempt for 260KB binary)

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("11111111111111111111111111111111"); // Replaced after first deploy

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
        order.token_offer = ctx.accounts.offer_mint.key();
        order.amount_offer = amount_offer;
        order.token_wanted = token_wanted;
        order.amount_wanted = amount_wanted;
        order.is_active = true;
        order.bump = ctx.bumps.order;

        // Transfer tokens to escrow
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.maker_token_account.to_account_info(),
                    to: ctx.accounts.escrow_token_account.to_account_info(),
                    authority: ctx.accounts.maker.to_account_info(),
                },
            ),
            amount_offer,
        )?;

        Ok(())
    }

    /// Execute OTC swap — taker fills the order
    pub fn execute_order(ctx: Context<ExecuteOrder>) -> Result<()> {
        let order = &ctx.accounts.order;
        require!(order.is_active, ErrorCode::OrderNotActive);

        let program = ctx.accounts.token_program.to_account_info();

        // Transfer wanted tokens from taker to maker
        token::transfer(
            CpiContext::new(
                program.clone(),
                Transfer {
                    from: ctx.accounts.taker_token_account.to_account_info(),
                    to: ctx.accounts.maker_wanted_account.to_account_info(),
                    authority: ctx.accounts.taker.to_account_info(),
                },
            ),
            order.amount_wanted,
        )?;

        // Transfer escrowed tokens to taker using PDA signer
        let seeds = &[
            b"order",
            order.maker.as_ref(),
            &order.order_id.to_le_bytes()[..],
            &[order.bump],
        ];

        token::transfer(
            CpiContext::new_with_signer(
                program,
                Transfer {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.taker_offer_account.to_account_info(),
                    authority: ctx.accounts.order.to_account_info(),
                },
                &[&seeds[..]],
            ),
            order.amount_offer,
        )?;

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

        let seeds = &[
            b"order",
            order.maker.as_ref(),
            &order.order_id.to_le_bytes()[..],
            &[order.bump],
        ];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.maker_token_account.to_account_info(),
                    authority: ctx.accounts.order.to_account_info(),
                },
                &[&seeds[..]],
            ),
            order.amount_offer,
        )?;

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

    #[account(mut, constraint = maker_token_account.mint == offer_mint.key())]
    pub maker_token_account: Account<'info, TokenAccount>,

    pub offer_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = maker,
        seeds = [b"escrow", order.key().as_ref()],
        bump,
        token::mint = offer_mint,
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

    /// Taker's wanted-token account (must match order.token_wanted)
    #[account(mut, constraint = taker_token_account.mint == order.token_wanted @ ErrorCode::WrongMint)]
    pub taker_token_account: Account<'info, TokenAccount>,

    /// Taker receives the escrowed offer tokens here (must match order.token_offer)
    #[account(mut, constraint = taker_offer_account.mint == order.token_offer @ ErrorCode::WrongMint)]
    pub taker_offer_account: Account<'info, TokenAccount>,

    /// Maker receives wanted tokens here (must match order.token_wanted)
    #[account(mut, constraint = maker_wanted_account.mint == order.token_wanted @ ErrorCode::WrongMint)]
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

    /// Return tokens to maker (must match the escrowed mint)
    #[account(mut, constraint = maker_token_account.mint == order.token_offer @ ErrorCode::WrongMint)]
    pub maker_token_account: Account<'info, TokenAccount>,

    #[account(mut, seeds = [b"escrow", order.key().as_ref()], bump)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ─── Data Structures ────────────────────────────────────────────────────────

#[account]
pub struct Order {
    pub maker: Pubkey,          // 32
    pub order_id: u64,          // 8
    pub token_offer: Pubkey,    // 32
    pub amount_offer: u64,      // 8
    pub token_wanted: Pubkey,   // 32
    pub amount_wanted: u64,     // 8
    pub is_active: bool,        // 1
    pub bump: u8,               // 1
}

impl Order {
    pub const LEN: usize = 32 + 8 + 32 + 8 + 32 + 8 + 1 + 1; // 122
}

// ─── Errors ─────────────────────────────────────────────────────────────────

#[error_code]
pub enum ErrorCode {
    #[msg("Order is not active")]
    OrderNotActive,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Wrong token mint")]
    WrongMint,
}
