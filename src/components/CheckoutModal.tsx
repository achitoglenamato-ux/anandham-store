import { ArrowRight, Banknote, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link } from 'wouter';
import { PHONE_PATTERN, errorMessage, isPermissionProblem, rupees } from '@/lib/format';
import { placeOrder } from '@/lib/store-data';
import type { OrderConfirmation, User } from '@/lib/types';
import type { BasketLine } from './BasketDrawer';

export function CheckoutModal({
  user,
  lines,
  grandTotal,
  onClose,
  onOrdered,
}: {
  user: User;
  lines: BasketLine[];
  grandTotal: number;
  onClose: () => void;
  onOrdered: (order: OrderConfirmation) => void;
}) {
  const [pending, setPending] = useState(false);
  const [orderError, setOrderError] = useState<unknown>(null);
  // Pre-filled from the customer's account; editable in case this order goes somewhere else.
  const [fields, setFields] = useState({ name: user.name, phone: user.phone, address: user.address });
  const [validation, setValidation] = useState('');

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = fields.name.trim();
    const phone = fields.phone.trim();
    const address = fields.address.trim();

    if (name.length < 2) return setValidation('Please enter your full name.');
    if (!PHONE_PATTERN.test(phone)) return setValidation('Please enter a valid phone / WhatsApp number (10 digits).');
    if (address.length < 8) return setValidation('Please enter your complete delivery address.');
    setValidation('');

    setPending(true);
    setOrderError(null);
    try {
      // Only ids and quantities are passed on. The real prices are read from the database.
      const order = await placeOrder(
        user,
        { name, phone, address },
        lines.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      );
      onOrdered(order);
    } catch (problem) {
      console.error(problem);
      setOrderError(problem);
      setPending(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <div className="modal-heading">
          <div>
            <span className="eyebrow">CHECKOUT · PAY ON DELIVERY</span>
            <h2 id="checkout-title">Confirm your order</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close checkout">
            <X size={20} />
          </button>
        </div>

        <div className="checkout-summary" data-testid="checkout-summary">
          {lines.map(({ product, quantity }) => (
            <div className="checkout-summary-line" key={product.id}>
              <span>
                {product.name}
                <small>
                  {' '}
                  · {product.unit} × {quantity}
                </small>
              </span>
              <strong>{rupees(product.price * quantity)}</strong>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="checkout-form">
          <label>
            Full name
            <input
              autoComplete="name"
              value={fields.name}
              onChange={event => setFields({ ...fields, name: event.target.value })}
              required
              minLength={2}
              maxLength={120}
              data-testid="input-customer-name"
            />
          </label>
          <label>
            Phone / WhatsApp number
            <input
              autoComplete="tel"
              type="tel"
              value={fields.phone}
              onChange={event => setFields({ ...fields, phone: event.target.value })}
              required
              maxLength={20}
              data-testid="input-customer-phone"
            />
          </label>
          <label>
            Delivery address
            <textarea
              autoComplete="street-address"
              value={fields.address}
              onChange={event => setFields({ ...fields, address: event.target.value })}
              required
              minLength={8}
              maxLength={500}
              rows={3}
              data-testid="input-customer-address"
            />
          </label>
          <p className="form-hint">Order updates go to {user.email}.</p>

          <div className="checkout-total">
            <span>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} · grand total
            </span>
            <strong data-testid="text-grand-total">{rupees(grandTotal)}</strong>
          </div>

          <div className="pay-note">
            <Banknote size={16} />
            <span>No online payment. Pay {rupees(grandTotal)} by Cash or UPI at your doorstep.</span>
          </div>

          {validation && (
            <p className="form-error" role="alert">
              {validation}
            </p>
          )}
          {orderError !== null && (
            <p className="form-error" role="alert" data-testid="text-order-error">
              {errorMessage(orderError)}{' '}
              {isPermissionProblem(orderError) && <Link href="/login?next=/">Log in again</Link>}
            </p>
          )}

          <button
            className="button-primary full-width"
            disabled={pending}
            type="submit"
            data-testid="button-place-order"
          >
            {pending ? (
              'Placing your order…'
            ) : (
              <>
                Place Order (Pay on Delivery) <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
