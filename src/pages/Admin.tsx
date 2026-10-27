import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Clock3, LogOut, Mail, MapPin, PackageCheck, Phone, Plus, RefreshCw,
  ShieldAlert, ShoppingBag, Store, Tags, CheckCircle2,
} from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Brand } from '@/components/Brand';
import { useAuth, useLogout } from '@/lib/auth';
import { errorMessage, isPermissionProblem, orderNumber, rupees } from '@/lib/format';
import {
  addProduct, deleteProduct, loadStartingCatalogue, summarise, updateOrderStatus, updateProductPrice,
  useAdminOrders, useProducts,
} from '@/lib/store-data';
import type { AdminOrder, OrderStatus, Product } from '@/lib/types';

const statusLabels: Record<OrderStatus, string> = {
  new: 'New order',
  called: 'Called',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/* ------------------------------------------------------------------ orders */

function AdminOrderCard({ order, onStatus }: { order: AdminOrder; onStatus: (id: string, status: OrderStatus) => void }) {
  const [expanded, setExpanded] = useState(true);
  const initials = order.customerName
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();

  return (
    <article className={`order-card status-${order.status}`} data-testid={`card-order-${order.id}`}>
      <div className="order-card-header">
        <div className="order-id-block">
          <span className={`status-pill status-${order.status}`}>
            <i />
            {statusLabels[order.status]}
          </span>
          <span className="order-number">Order #{orderNumber(order.id)}</span>
          <span className="order-time">
            <Clock3 size={13} />
            {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        </div>
        <button
          className="icon-button order-toggle"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Collapse order details' : 'Expand order details'}
          aria-expanded={expanded}
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {expanded && (
        <div className="order-card-body">
          <div className="customer-block">
            <div className="customer-avatar">{initials}</div>
            <div>
              <h3 data-testid={`text-customer-name-${order.id}`}>{order.customerName}</h3>
              <a href={`tel:${order.customerPhone}`} className="customer-phone" data-testid={`link-phone-${order.id}`}>
                <Phone size={14} />
                {order.customerPhone}
              </a>
              <a href={`mailto:${order.customerEmail}`} className="customer-phone customer-email">
                <Mail size={14} />
                {order.customerEmail}
              </a>
            </div>
          </div>
          <div className="address-block" data-testid={`text-address-${order.id}`}>
            <MapPin size={15} />
            <span>{order.customerAddress}</span>
          </div>

          <div className="ordered-items" aria-label="Items to pack">
            {order.items.map((item, index) => (
              <div className="ordered-item" key={`${item.productId}-${index}`}>
                <span>
                  <b className="ordered-qty">{item.quantity} ×</b> {item.name}
                  <small>
                    {' '}
                    · {item.unit} · {rupees(item.price)} each
                  </small>
                </span>
                <strong>{rupees(item.lineTotal)}</strong>
              </div>
            ))}
          </div>

          <div className="order-card-foot">
            <div>
              <small>BILL TOTAL · COLLECT ON DELIVERY (CASH / UPI)</small>
              <strong data-testid={`text-total-${order.id}`}>{rupees(order.grandTotal)}</strong>
            </div>
            <label className="status-select-label">
              Update status
              <select
                value={order.status}
                onChange={event => onStatus(order.id, event.target.value as OrderStatus)}
                data-testid={`select-status-${order.id}`}
                aria-label={`Update status for order ${orderNumber(order.id)}`}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}
    </article>
  );
}

function OrdersPanel({ ordersQuery }: { ordersQuery: ReturnType<typeof useAdminOrders> }) {
  const [statusError, setStatusError] = useState<unknown>(null);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  const orders = ordersQuery.data ?? [];
  const visible = filter === 'all' ? orders : orders.filter(order => order.status === filter);

  // The list updates by itself (live) once the status is saved.
  const onStatus = async (id: string, status: OrderStatus) => {
    setStatusError(null);
    try {
      await updateOrderStatus(id, status);
    } catch (problem) {
      console.error(problem);
      setStatusError(problem);
    }
  };

  if (ordersQuery.isLoading) {
    return (
      <div className="orders-list">
        {[0, 1].map(n => (
          <div className="skeleton-card" key={n}>
            <div className="skeleton-line short" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
        ))}
      </div>
    );
  }
  if (ordersQuery.isError) {
    return (
      <div className="state-panel admin-error">
        <span className="state-symbol">
          <ShieldAlert size={22} />
        </span>
        <h3>The orders didn’t load.</h3>
        <p>{errorMessage(ordersQuery.error)}</p>
        <button className="button-secondary" onClick={() => ordersQuery.refetch()} data-testid="button-retry-admin">
          Try again
        </button>
      </div>
    );
  }

  return (
    <section className="orders-section" aria-label="Customer orders">
      <div className="orders-heading">
        <div>
          <span className="eyebrow">DELIVERY LIST</span>
          <h2>
            Customer orders <span>{orders.length}</span>
          </h2>
        </div>
        <div className="order-filters" aria-label="Filter orders">
          {(['all', 'new', 'called', 'completed', 'cancelled'] as const).map(value => (
            <button
              key={value}
              className={filter === value ? 'active' : ''}
              onClick={() => setFilter(value)}
              data-testid={`button-filter-${value}`}
            >
              {value === 'all' ? 'All orders' : statusLabels[value]}
            </button>
          ))}
        </div>
      </div>

      {statusError !== null && (
        <div className="inline-alert" role="alert">
          <ShieldAlert size={17} />
          Couldn’t update the order. {errorMessage(statusError)}
        </div>
      )}
      <div className="refreshing-note">
        <RefreshCw size={13} /> New orders appear here automatically.
      </div>

      {visible.length === 0 ? (
        <div className="orders-empty">
          <span>
            <PackageCheck size={24} />
          </span>
          <h3>{orders.length ? 'No orders with this status.' : 'No orders yet.'}</h3>
          <p>
            {orders.length
              ? 'Pick another status filter to see more.'
              : 'When a customer places an order, their details and items will appear here.'}
          </p>
          {filter !== 'all' && (
            <button className="button-secondary" onClick={() => setFilter('all')}>
              Show all orders
            </button>
          )}
        </div>
      ) : (
        <div className="orders-list">
          {visible.map(order => (
            <AdminOrderCard key={order.id} order={order} onStatus={onStatus} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ prices */

function PriceRow({ product }: { product: Product }) {
  const [value, setValue] = useState(String(product.price));
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Keep the input in sync with the saved price (after a save or a live change).
  useEffect(() => setValue(String(product.price)), [product.price]);
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [saved]);

  const newPrice = Number(value);
  const valid = value.trim() !== '' && Number.isFinite(newPrice) && newPrice >= 0 && newPrice <= 1_000_000;
  const changed = valid && Math.round(newPrice * 100) !== Math.round(product.price * 100);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!changed) return;
    setPending(true);
    setError(null);
    try {
      await updateProductPrice(product.id, newPrice);
      setSaved(true);
    } catch (problem) {
      console.error(problem);
      setError(problem);
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Remove “${product.name}” from the catalogue? Orders already placed are not affected.`)) return;
    setError(null);
    try {
      await deleteProduct(product.id);
    } catch (problem) {
      console.error(problem);
      setError(problem);
    }
  };

  return (
    <form className="price-row" onSubmit={submit} data-testid={`row-product-${product.id}`}>
      <div className="price-row-name">
        <strong>{product.name}</strong>
        <small>{product.unit}</small>
        <button type="button" className="link-button danger" onClick={remove} data-testid={`button-remove-${product.id}`}>
          Remove
        </button>
      </div>
      <div className="price-row-current" aria-label="Current price">
        <small>CURRENT</small>
        <b data-testid={`text-current-price-${product.id}`}>{rupees(product.price)}</b>
      </div>
      <label className="price-input">
        <span className="sr-only">New price for {product.name} in rupees</span>
        <span className="price-prefix" aria-hidden="true">
          ₹
        </span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={1000000}
          step="0.01"
          value={value}
          onChange={event => {
            setValue(event.target.value);
            setSaved(false);
            setError(null);
          }}
          aria-invalid={!valid}
          data-testid={`input-price-${product.id}`}
        />
      </label>
      <button
        className="button-primary price-save"
        type="submit"
        disabled={!changed || pending}
        data-testid={`button-save-price-${product.id}`}
      >
        {pending ? (
          'Saving…'
        ) : saved ? (
          <>
            <Check size={14} /> Saved
          </>
        ) : (
          'Save price'
        )}
      </button>
      {error !== null && (
        <p className="form-error price-row-error" role="alert">
          {errorMessage(error)}
        </p>
      )}
    </form>
  );
}

function AddProductForm({ products }: { products: Product[] }) {
  const [fields, setFields] = useState({ name: '', category: '', unit: '', price: '' });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [added, setAdded] = useState('');
  const categories = useMemo(() => Array.from(new Set(products.map(product => product.category))), [products]);
  const set = (key: keyof typeof fields) => (event: { target: { value: string } }) => {
    setFields(current => ({ ...current, [key]: event.target.value }));
    setAdded('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await addProduct({ ...fields, price: Number(fields.price) }, products);
      setAdded(fields.name.trim());
      setFields({ name: '', category: fields.category, unit: '', price: '' });
    } catch (problem) {
      console.error(problem);
      setError(problem);
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="checkout-form add-product" onSubmit={submit} data-testid="form-add-product">
      <h3 className="price-group-title">ADD A NEW PRODUCT</h3>
      <div className="add-product-fields">
        <label>
          Product name
          <input value={fields.name} onChange={set('name')} required maxLength={120} placeholder="e.g. Brown Sugar" data-testid="input-new-name" />
        </label>
        <label>
          Category
          <input value={fields.category} onChange={set('category')} required maxLength={60} list="category-list" placeholder="e.g. SPICES" data-testid="input-new-category" />
          <datalist id="category-list">
            {categories.map(category => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>
        <label>
          Pack size
          <input value={fields.unit} onChange={set('unit')} required maxLength={60} placeholder="e.g. 1 kg pocket" data-testid="input-new-unit" />
        </label>
        <label>
          Price (₹)
          <input type="number" inputMode="decimal" min={0} max={1000000} step="0.01" value={fields.price} onChange={set('price')} required data-testid="input-new-price" />
        </label>
        <button className="button-primary price-save" type="submit" disabled={pending} data-testid="button-add-product">
          <Plus size={14} /> {pending ? 'Adding…' : 'Add'}
        </button>
      </div>
      {error !== null && (
        <p className="form-error" role="alert">
          {errorMessage(error)}
        </p>
      )}
      {added && <p className="form-hint form-notice">“{added}” was added. Customers can see it now.</p>}
    </form>
  );
}

function PricesPanel() {
  const { data: products, isLoading, isError, error, refetch } = useProducts();
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);
  const [catalogueError, setCatalogueError] = useState<unknown>(null);

  const groups = useMemo(() => {
    const byCategory = new Map<string, Product[]>();
    for (const product of products ?? []) {
      byCategory.set(product.category, [...(byCategory.get(product.category) ?? []), product]);
    }
    return [...byCategory.entries()];
  }, [products]);

  const loadCatalogue = async () => {
    setLoadingCatalogue(true);
    setCatalogueError(null);
    try {
      await loadStartingCatalogue(products ?? []);
    } catch (problem) {
      console.error(problem);
      setCatalogueError(problem);
    } finally {
      setLoadingCatalogue(false);
    }
  };

  if (isLoading) {
    return (
      <div className="orders-list">
        <div className="skeleton-card">
          <div className="skeleton-line short" />
          <div className="skeleton-line" />
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="state-panel admin-error">
        <span className="state-symbol">
          <ShieldAlert size={22} />
        </span>
        <h3>The product list didn’t load.</h3>
        <p>{errorMessage(error)}</p>
        <button className="button-secondary" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <section className="orders-section" aria-label="Product prices">
      <div className="orders-heading">
        <div>
          <span className="eyebrow">DAILY PRICES</span>
          <h2>
            Update prices <span>{products?.length ?? 0}</span>
          </h2>
        </div>
        <p className="price-help">Type the new price in rupees and press “Save price”. Customers see it straight away.</p>
      </div>

      {products?.length === 0 && (
        <div className="state-panel admin-error">
          <span className="state-symbol">
            <Tags size={22} />
          </span>
          <h3>The catalogue is empty.</h3>
          <p>Load Anandham Store’s starting list of groceries with one click, then change prices or add your own items.</p>
          <button className="button-primary" onClick={loadCatalogue} disabled={loadingCatalogue} data-testid="button-load-catalogue">
            {loadingCatalogue ? 'Loading…' : 'Load the starting catalogue'}
          </button>
          {catalogueError !== null && (
            <p className="form-error" role="alert">
              {errorMessage(catalogueError)}
            </p>
          )}
        </div>
      )}

      {groups.map(([category, items]) => (
        <div className="price-group" key={category}>
          <h3 className="price-group-title">{category}</h3>
          {items.map(product => (
            <PriceRow key={product.id} product={product} />
          ))}
        </div>
      ))}

      <AddProductForm products={products ?? []} />
    </section>
  );
}

/* --------------------------------------------------------------- dashboard */

function AdminDashboard() {
  const ordersQuery = useAdminOrders();
  const [tab, setTab] = useState<'orders' | 'prices'>('orders');
  const summary = useMemo(() => (ordersQuery.data ? summarise(ordersQuery.data) : undefined), [ordersQuery.data]);

  return (
    <main className="admin-main">
      <div className="admin-welcome">
        <div>
          <span className="eyebrow">ANANDHAM STORE · OWNER DESK</span>
          <h1>
            Welcome, <em>shopkeeper.</em>
          </h1>
          <p>See who ordered what, pack and deliver, and keep today’s prices up to date.</p>
        </div>
        <div className="admin-date">
          <span>TODAY</span>
          <strong>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
        </div>
      </div>

      {ordersQuery.isError && (
        <div className="inline-alert" role="alert">
          <ShieldAlert size={17} />
          {isPermissionProblem(ordersQuery.error)
            ? 'The database refused this request. Check that this account is the owner (admins collection) and that the rules from firestore.rules are published.'
            : `Couldn’t load the summary. ${errorMessage(ordersQuery.error)}`}
        </div>
      )}

      <section className="summary-grid" aria-label="Store summary">
        <article className="summary-tile tile-orders">
          <span>ALL ORDERS</span>
          <strong data-testid="summary-total-orders">{summary?.totalOrders ?? '–'}</strong>
          <small>Since the shop went online</small>
          <ShoppingBag className="tile-icon" size={21} />
        </article>
        <article className="summary-tile tile-new">
          <span>NEW ORDERS</span>
          <strong data-testid="summary-new-orders">{summary?.newOrders ?? '–'}</strong>
          <small>Waiting to be packed and delivered</small>
          <Phone className="tile-icon" size={21} />
        </article>
        <article className="summary-tile tile-sales">
          <span>COMPLETED SALES</span>
          <strong data-testid="summary-total-sales">{summary ? rupees(summary.totalSales) : '–'}</strong>
          <small>From orders marked completed</small>
          <CheckCircle2 className="tile-icon" size={21} />
        </article>
      </section>

      <div className="admin-tabs" role="tablist" aria-label="Owner desk sections">
        <button
          role="tab"
          aria-selected={tab === 'orders'}
          className={tab === 'orders' ? 'active' : ''}
          onClick={() => setTab('orders')}
          data-testid="tab-orders"
        >
          <PackageCheck size={15} /> Orders
        </button>
        <button
          role="tab"
          aria-selected={tab === 'prices'}
          className={tab === 'prices' ? 'active' : ''}
          onClick={() => setTab('prices')}
          data-testid="tab-prices"
        >
          <Tags size={15} /> Product prices
        </button>
      </div>

      {tab === 'orders' ? <OrdersPanel ordersQuery={ordersQuery} /> : <PricesPanel />}
    </main>
  );
}

/* -------------------------------------------------------------------- page */

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const { logout } = useLogout();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="skeleton-line short" />
        <div className="skeleton-line" />
      </div>
    );
  }

  // Not signed in: ask the owner to log in, then bring them straight back here.
  if (!user) {
    return (
      <div className="admin-auth-page">
        <Brand />
        <div className="admin-auth-card">
          <span className="admin-lock">
            <Store size={24} />
          </span>
          <span className="eyebrow">ANANDHAM STORE · OWNER DESK</span>
          <h1>
            Owner <em>login.</em>
          </h1>
          <p>Log in with the owner account to see customer orders and update prices.</p>
          <Link href="/login?next=/admin" className="button-primary full-width" data-testid="link-admin-sign-in">
            Log in to the owner desk <ArrowRight size={17} />
          </Link>
        </div>
        <footer>ANANDHAM STORE</footer>
      </div>
    );
  }

  // Signed in but not the owner. (The API refuses admin data to these accounts as well.)
  if (user.role !== 'admin') {
    return (
      <div className="admin-auth-page">
        <Brand />
        <div className="admin-auth-card" data-testid="panel-not-authorized">
          <span className="admin-lock">
            <ShieldAlert size={24} />
          </span>
          <span className="eyebrow">OWNER DESK</span>
          <h1>
            Owner <em>access only.</em>
          </h1>
          <p>This account ({user.email}) is not allowed to manage the store.</p>
          <Link href="/" className="button-primary full-width">
            Back to the catalog <ArrowRight size={17} />
          </Link>
          <p className="auth-small">
            Setting up the owner? In the Firebase console, add a document to the <b>admins</b> collection whose
            Document ID is the account ID below, then refresh this page.
          </p>
          <code className="uid-box" data-testid="text-account-id">
            {user.id}
          </code>
        </div>
        <footer>ANANDHAM STORE</footer>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-inner">
          <Brand />
          <div className="admin-header-right">
            <span className="signed-in">
              <span className="signed-dot" />
              SIGNED IN AS {user.email}
            </span>
            <button className="signout-button" onClick={() => logout(() => setLocation('/login'))} data-testid="button-admin-sign-out">
              <LogOut size={15} /> Log out
            </button>
            <Link href="/" className="back-to-shop">
              <ArrowLeft size={15} /> Storefront
            </Link>
          </div>
        </div>
      </header>
      <AdminDashboard />
      <footer className="admin-footer">
        <Brand compact />
        <span>Thank you for keeping the neighbourhood fed.</span>
      </footer>
    </div>
  );
}
