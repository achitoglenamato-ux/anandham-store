import {
  ArrowDownRight, Leaf, PackageCheck, Phone, RefreshCw, Search, ShoppingBag, ShoppingBasket, Truck, ArrowRight,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BasketDrawer, type BasketLine } from '@/components/BasketDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { OrderSuccess } from '@/components/OrderSuccess';
import { ProductCard } from '@/components/ProductCard';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { WelcomeBanner } from '@/components/WelcomeBanner';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { errorMessage, rupees } from '@/lib/format';
import { useProducts } from '@/lib/store-data';
import type { OrderConfirmation } from '@/lib/types';

function ProductSkeleton() {
  return (
    <div className="product-grid" aria-label="Loading catalog">
      {[0, 1, 2, 3, 4, 5].map(n => (
        <div className="skeleton-card" key={n}>
          <div className="skeleton-block" />
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
          <div className="skeleton-button" />
        </div>
      ))}
    </div>
  );
}

export default function Storefront() {
  const { data: products, isLoading, isError, error, refetch } = useProducts();
  const { user } = useAuth();
  const cart = useCart();

  const [category, setCategory] = useState('Everything');
  const [search, setSearch] = useState('');
  const [basketOpen, setBasketOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordered, setOrdered] = useState<OrderConfirmation | null>(null);

  // Forget basket items for products that no longer exist.
  useEffect(() => {
    if (!products) return;
    const known = new Set(products.map(product => product.id));
    for (const [id, quantity] of Object.entries(cart.lines)) {
      if (!known.has(id)) cart.change(id, -quantity);
    }
  }, [products, cart]);

  const categories = useMemo(
    () => ['Everything', ...Array.from(new Set((products ?? []).map(product => product.category)))],
    [products],
  );

  const visible = useMemo(() => {
    const needle = search.toLowerCase().trim();
    return (products ?? []).filter(
      product =>
        (category === 'Everything' || product.category === category) &&
        `${product.name} ${product.category} ${product.unit}`.toLowerCase().includes(needle),
    );
  }, [products, category, search]);

  const lines: BasketLine[] = useMemo(
    () =>
      (products ?? [])
        .filter(product => cart.lines[product.id])
        .map(product => ({ product, quantity: cart.lines[product.id] })),
    [products, cart.lines],
  );
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  // Sum in paise so the displayed bill never shows floating-point drift.
  const grandTotal =
    lines.reduce((sum, { product, quantity }) => sum + Math.round(product.price * 100) * quantity, 0) / 100;

  const openCheckout = () => {
    setBasketOpen(false);
    setCheckoutOpen(true);
  };

  return (
    <div className="storefront">
      <SiteHeader onBasket={() => setBasketOpen(true)} />
      <WelcomeBanner />
      <main>
        <section className="hero-wrap">
          <div className="hero">
            <div className="hero-copy">
              <div className="hero-kicker">
                <span className="kicker-dot" /> YOUR NEIGHBOURHOOD GROCER
              </div>
              <h1>
                Anandham Store.
                <br />
                <em>Fresh to your door.</em>
              </h1>
              <p>
                Dairy, snacks, spices, vegetables, flours and dals. Add what you need to your cart and we will
                deliver it to your home.
              </p>
              <a href="#shop" className="button-primary hero-cta" data-testid="link-shop-products">
                Browse the catalog <ArrowDownRight size={17} />
              </a>
              <div className="hero-proof">
                <span className="proof-icon">
                  <PackageCheck size={15} />
                </span>
                <span>
                  <b>Pay only on delivery.</b>
                  <small>Cash or UPI at your doorstep.</small>
                </span>
              </div>
            </div>
            <div className="hero-visual" aria-label="Illustration of a grocery bag">
              <div className="sun-disc" />
              <div className="hero-sticker">
                FRESH
                <br />
                TO YOUR
                <br />
                <b>DOOR</b>
              </div>
              <div className="produce produce-one">●</div>
              <div className="produce produce-two">●</div>
              <div className="produce produce-three">●</div>
              <div className="paper-bag">
                <div className="bag-handles" />
                <div className="bag-fold" />
                <span className="bag-logo">
                  Anandham
                  <br />
                  Store
                </span>
                <span className="bag-stem" />
                <span className="bag-leaf leaf-a" />
                <span className="bag-leaf leaf-b" />
              </div>
              <div className="hero-note">
                <span>01</span>
                <span>
                  Cash or UPI
                  <br />
                  at your door
                </span>
                <Leaf size={17} />
              </div>
            </div>
            <div className="hero-side-note">ANANDHAM STORE · YOUR LOCAL GROCER</div>
          </div>
          <div className="perks-strip">
            <div>
              <span>
                <Truck size={18} />
              </span>
              <p>
                <b>Home delivery</b>
                <small>To your door, with care</small>
              </p>
            </div>
            <div>
              <span>
                <Phone size={18} />
              </span>
              <p>
                <b>Order online</b>
                <small>Submit your request in minutes</small>
              </p>
            </div>
            <div>
              <span>
                <PackageCheck size={18} />
              </span>
              <p>
                <b>Pay on delivery</b>
                <small>No online payment needed</small>
              </p>
            </div>
            <div className="perks-message">
              A small shop with a big heart <span>— right in your neighbourhood.</span>
            </div>
          </div>
        </section>

        <section className="shop-section" id="shop">
          <div className="shop-topline">
            <span className="eyebrow">OUR CATALOG</span>
            <span className="shop-count">{products?.length ?? 0} items available</span>
          </div>
          <div className="shop-title-row">
            <div>
              <h2>Today’s prices.</h2>
              <p>Everyday groceries. Prices are updated daily by the shop.</p>
            </div>
            <label className="search-box">
              <Search size={17} />
              <input
                type="search"
                placeholder="Search products…"
                aria-label="Search products"
                value={search}
                onChange={event => setSearch(event.target.value)}
                data-testid="input-search-products"
              />
            </label>
          </div>

          {products && products.length > 0 && (
            <div className="category-row" role="tablist" aria-label="Product categories">
              {categories.map(item => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`category-chip ${category === item ? 'selected' : ''}`}
                  role="tab"
                  aria-selected={category === item}
                  data-testid={`button-category-${item.toLowerCase().replaceAll(' ', '-')}`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <ProductSkeleton />
          ) : isError ? (
            <div className="state-panel error-panel">
              <span className="state-symbol">
                <RefreshCw size={22} />
              </span>
              <h3>We can’t load the catalog right now.</h3>
              <p>{errorMessage(error)}</p>
              <button className="button-secondary" onClick={() => refetch()} data-testid="button-retry-products">
                Try again
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="state-panel">
              <span className="state-symbol">
                <ShoppingBasket size={22} />
              </span>
              <h3>{products?.length ? 'Nothing matches that search.' : 'The catalog is being set up.'}</h3>
              <p>
                {products?.length
                  ? 'Try another search or choose a different category.'
                  : 'Please check back in a little while.'}
              </p>
              {search && (
                <button className="button-secondary" onClick={() => setSearch('')}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="product-grid">
              {visible.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  inCart={cart.lines[product.id] ?? 0}
                  onAdd={amount => cart.add(product.id, amount)}
                />
              ))}
            </div>
          )}

          <div className="shop-note">
            <span className="note-line" />
            <p>Your final bill is shown at checkout and paid by Cash or UPI when your order is delivered.</p>
            <span className="note-line" />
          </div>
        </section>
      </main>
      <SiteFooter />

      {itemCount > 0 && (
        <button className="mobile-basket" onClick={() => setBasketOpen(true)} data-testid="button-mobile-basket">
          <ShoppingBag size={18} />
          <span>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
          <b>{rupees(grandTotal)}</b>
          <ArrowRight size={17} />
        </button>
      )}

      {basketOpen && (
        <BasketDrawer
          lines={lines}
          grandTotal={grandTotal}
          onClose={() => setBasketOpen(false)}
          onCheckout={openCheckout}
        />
      )}
      {checkoutOpen && user && lines.length > 0 && (
        <CheckoutModal
          user={user}
          lines={lines}
          grandTotal={grandTotal}
          onClose={() => setCheckoutOpen(false)}
          onOrdered={order => {
            cart.clear();
            setCheckoutOpen(false);
            setOrdered(order);
          }}
        />
      )}
      {ordered && <OrderSuccess order={ordered} onDone={() => setOrdered(null)} />}
    </div>
  );
}
