# Solana OTC Escrow — Deploy Instructions (Anchor Framework)
#
# Prerequisites:
#   1. Install Solana CLI:    sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
#   2. Install Anchor CLI:    cargo install --git https://github.com/coral-xyz/anchor anchor-cli
#   3. Have SOL in wallet:    ~0.02 SOL (~$4-5)
#   4. Set cluster:           solana config set --url mainnet-beta
#
# Build & Deploy:
#   cd contracts/solana/otc_escrow
#   anchor init .                    # Generate Anchor.toml if not present
#   anchor build                     # Compile the program
#   anchor deploy                    # Deploy to mainnet
#
# The deploy will output the Program ID. Copy it and:
#   1. Replace "YOUR_PROGRAM_ID_HERE" in src/lib.rs with the actual ID
#   2. Add the Program ID to the app frontend
#
# After deploy:
#   - Users interact via SPL token accounts
#   - PDA-based escrow (trustless, no admin key)
#   - Each order creates a PDA: seeds = ["order", maker, order_id]
