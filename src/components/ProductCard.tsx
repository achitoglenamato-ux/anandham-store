import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { rupees } from '@/lib/format';
import { productEmoji } from '@/lib/product-emoji';
import type { Product } from '@/lib/types';

export function ProductCard({
  product,
  inCart,
  onAdd,
}: {
  product: Product;
  inCart: number;
  onAdd: (amount: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  return (
    <article className="product-card" data-testid={`card-product-${product.id}`}>
      <div className="product-art">
        {product.image ? (
          <img className="product-photo" src={product.image} alt={product.name} loading="lazy" />
        ) : (
          <span className="product-icon" role="img" aria-label={product.name}>
            {productEmoji(product)}
          </span>
        )}
        <span className="product-category">{product.category}</span>
      </div>
      <div className="product-copy">
        <div className="product-title-row">
          <h3>{product.name}</h3>
          <span className="price" data-testid={`text-price-${product.id}`}>
            {rupees(product.price)}
          </span>
        </div>
        <p className="product-unit">{product.unit}</p>
        <div className="product-actions">
          <div className="product-quantity" aria-label={`Quantity for ${product.name}`}>
            <button
              type="button"
              onClick={() => setQuantity(value => Math.max(1, value - 1))}
              aria-label={`Decrease ${product.name} quantity`}
              data-testid={`button-product-decrease-${product.id}`}
            >
              <Minus size={13} />
            </button>
            <span aria-live="polite">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(value => Math.min(99, value + 1))}
              aria-label={`Increase ${product.name} quantity`}
              data-testid={`button-product-increase-${product.id}`}
            >
              <Plus size={13} />
            </button>
          </div>
          <button
            className="add-button"
            onClick={() => {
              onAdd(quantity);
              setQuantity(1);
            }}
            data-testid={`button-add-${product.id}`}
          >
            <ShoppingBag size={14} /> Add to Cart
          </button>
        </div>
        {inCart > 0 && (
          <p className="cart-hint" aria-live="polite">
            {inCart} in your cart
          </p>
        )}
      </div>
    </article>
  );
}
