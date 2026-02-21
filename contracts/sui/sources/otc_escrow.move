// Sui OTC Escrow Contract (Move Language)
// Deploy cost: ~0.1 SUI ($0.30-0.50) one-time

#[allow(lint(public_entry))]
module otc_escrow::escrow {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;

    // ─── Errors ─────────────────────────────────────────────────────────────

    const EOrderNotActive: u64 = 0;
    const EUnauthorized: u64 = 1;
    const EInsufficientFunds: u64 = 2;
    const EWrongToken: u64 = 3;

    // ─── Structs ────────────────────────────────────────────────────────────

    /// OTC Order with escrowed funds
    public struct Order<phantom OfferCoin, phantom WantedCoin> has key, store {
        id: UID,
        maker: address,
        escrowed_balance: Balance<OfferCoin>,
        amount_wanted: u64,
        is_active: bool,
    }

    /// Capability for order management
    public struct OrderCap has key, store {
        id: UID,
        order_id: ID,
    }

    // ─── Events ─────────────────────────────────────────────────────────────

    public struct OrderCreated has copy, drop {
        order_id: ID,
        maker: address,
        amount_offer: u64,
        amount_wanted: u64,
    }

    public struct OrderExecuted has copy, drop {
        order_id: ID,
        taker: address,
    }

    public struct OrderCancelled has copy, drop {
        order_id: ID,
    }

    // ─── Public Functions ───────────────────────────────────────────────────

    /// Create a new OTC order
    public entry fun create_order<OfferCoin, WantedCoin>(
        offer_coin: Coin<OfferCoin>,
        amount_wanted: u64,
        ctx: &mut TxContext
    ) {
        let maker = ctx.sender();
        let amount_offer = coin::value(&offer_coin);
        
        let order_uid = object::new(ctx);
        let order_id = order_uid.to_inner();

        let order = Order<OfferCoin, WantedCoin> {
            id: order_uid,
            maker,
            escrowed_balance: coin::into_balance(offer_coin),
            amount_wanted,
            is_active: true,
        };

        // Create capability for order management
        let cap = OrderCap {
            id: object::new(ctx),
            order_id,
        };

        event::emit(OrderCreated {
            order_id,
            maker,
            amount_offer,
            amount_wanted,
        });

        // Share order publicly and transfer cap to maker
        transfer::share_object(order);
        transfer::transfer(cap, maker);
    }

    /// Execute OTC swap
    public entry fun execute_order<OfferCoin, WantedCoin>(
        order: &mut Order<OfferCoin, WantedCoin>,
        payment: Coin<WantedCoin>,
        ctx: &mut TxContext
    ) {
        assert!(order.is_active, EOrderNotActive);
        assert!(coin::value(&payment) >= order.amount_wanted, EInsufficientFunds);

        let taker = ctx.sender();

        // Take escrowed coins and send to taker
        let escrowed_amount = balance::value(&order.escrowed_balance);
        let offer_coin = coin::take(&mut order.escrowed_balance, escrowed_amount, ctx);
        transfer::public_transfer(offer_coin, taker);

        // Send payment to maker
        transfer::public_transfer(payment, order.maker);

        // Mark order as inactive
        order.is_active = false;

        event::emit(OrderExecuted {
            order_id: order.id.to_inner(),
            taker,
        });
    }

    /// Cancel order and return funds to maker
    public entry fun cancel_order<OfferCoin, WantedCoin>(
        order: &mut Order<OfferCoin, WantedCoin>,
        cap: &OrderCap,
        ctx: &mut TxContext
    ) {
        assert!(order.is_active, EOrderNotActive);
        assert!(cap.order_id == order.id.to_inner(), EWrongToken);
        
        let maker = ctx.sender();
        assert!(maker == order.maker, EUnauthorized);

        // Return escrowed funds to maker
        let escrowed_amount = balance::value(&order.escrowed_balance);
        let refund = coin::take(&mut order.escrowed_balance, escrowed_amount, ctx);
        transfer::public_transfer(refund, maker);

        // Mark order as inactive
        order.is_active = false;

        event::emit(OrderCancelled {
            order_id: order.id.to_inner(),
        });
    }

    /// Delete an inactive order (cleanup)
    public entry fun delete_order<OfferCoin, WantedCoin>(
        order: Order<OfferCoin, WantedCoin>,
        cap: OrderCap,
    ) {
        assert!(!order.is_active, EOrderNotActive);
        
        let Order { id, maker: _, escrowed_balance, amount_wanted: _, is_active: _ } = order;
        
        // Ensure no funds remain
        assert!(balance::value(&escrowed_balance) == 0, EInsufficientFunds);
        balance::destroy_zero(escrowed_balance);
        object::delete(id);

        let OrderCap { id: cap_id, order_id: _ } = cap;
        object::delete(cap_id);
    }

    // ─── View Functions ─────────────────────────────────────────────────────

    /// Get order details
    public fun get_order_info<OfferCoin, WantedCoin>(
        order: &Order<OfferCoin, WantedCoin>
    ): (address, u64, u64, bool) {
        (
            order.maker,
            balance::value(&order.escrowed_balance),
            order.amount_wanted,
            order.is_active
        )
    }
}
