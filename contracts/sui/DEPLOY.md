# Sui OTC Escrow — Deploy Instructions
#
# Prerequisites:
#   1. Install Sui CLI: https://docs.sui.io/build/install
#   2. Have SUI tokens in your wallet (~0.1 SUI = ~$0.30)
#   3. Set active address: sui client active-address
#
# Deploy:
#   cd contracts/sui
#   sui move build
#   sui client publish --gas-budget 100000000
#
# The output will show the package ID. Copy it and add to the app:
#   src/lib/contracts/otcEscrowAbi.ts → SUI_OTC_PACKAGE_ID
#
# After deploy, the package is immutable and live on Sui mainnet.
# Users create orders by calling otc_escrow::escrow::create_order
# with their Coin objects as arguments.
