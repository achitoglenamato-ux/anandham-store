import { ArrowRight, Minus, Plus, ShoppingBasket, X } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { rupees } from '@/lib/format';
import { productEmoji } from '@/lib/product-emoji';
import type { Product } from '@/lib/types';

export type BasketLine = { product: Product; quantity: number };

export function BasketDrawer({
  lines,
  grandTotal,
  onCheckout,
  onClose,
}: {
  lines: BasketLine[];
  grandTotal: number;
  onCheckout: () => void;
  onClose: () => void;
}) {
  const { change } = useCart();
  const { user } = useAuth();

  return (
    <div
      className="basket-overlay"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="basket-drawer" aria-label="Your basket">
        <div className="basket-head">
          <div>
            <span className="eyebrow">YOUR ORDER</span>
            <h2>Your basket</h2>
          </div>
          <button className="icon-button" aria-label="Close basket" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="basket-empty">
            <span>
              <ShoppingBasket size={25} />
            </span>
            <h3>Your basket is empty.</h3>
            <p>Add a few items from our catalog and they will show up here.</p>
            <button className="button-secondary" onClick={onClose}>
              Browse catalog
            </button>
          </div>
        ) : (
          <>
            <div className="basket-lines">
              {lines.map(({ product, quantity }) => (
                <div className="basket-line" key={product.id}>
                  <span className="basket-product-icon" aria-hidden="true">
                    {product.image ? <img src={product.image} alt="" /> : productEmoji(product)}
                  </span>
                  <div className="basket-line-copy">
                    <strong>{product.name}</strong>
                    <small>
                      {rupees(product.price)} · {product.unit}
                    </small>
                  </div>
                  <div className="quantity-control">
                    <button
                      onClick={() => change(product.id, -1)}
                      aria-label={`Remove one ${product.name}`}
                      data-testid={`button-decrease-${product.id}`}
                    >
                      <Minus size={14} />
                    </button>
                    <span>{quantity}</span>
                    <button
                      onClick={() => change(product.id, 1)}
                      aria-label={`Add one ${product.name}`}
                      data-testid={`button-increase-${product.id}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <strong className="line-price">{rupees(product.price * quantity)}</strong>
                </div>
              ))}
            </div>

            <div className="basket-bottom">
              <div className="basket-total">
                <span>Total</span>
                <strong data-testid="text-basket-total">{rupees(grandTotal)}</strong>
              </div>
              {user ? (
                <>
                  <p>No online payment. You pay by Cash or UPI when your order arrives.</p>
                  <button className="button-primary full-width" onClick={onCheckout} data-testid="button-checkout">
                    Continue to checkout <ArrowRight size={17} />
                  </button>
                </>
              ) : (
                <div className="basket-login-note" data-testid="note-login-required">
                  <p>Please log in or create a free account to place your order. Your basket will be saved.</p>
                  <div className="basket-login-actions">
                    <Link href="/login?next=/" className="button-primary" data-testid="link-basket-login">
                      Log in
                    </Link>
                    <Link href="/register?next=/" className="button-secondary" data-testid="link-basket-register">
                      Register
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
