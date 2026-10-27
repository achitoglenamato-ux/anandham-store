import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { orderNumber, rupees } from '@/lib/format';
import type { OrderConfirmation } from '@/lib/types';

export function OrderSuccess({ order, onDone }: { order: OrderConfirmation; onDone: () => void }) {
  return (
    <div className="modal-backdrop">
      <section className="success-modal" role="dialog" aria-modal="true" aria-labelledby="success-title">
        <span className="success-mark">
          <CheckCircle2 size={34} />
        </span>
        <span className="eyebrow">ORDER RECEIVED</span>
        <h2 id="success-title">Thank you!</h2>
        <p>
          Your order request has been sent to Anandham Store. Please keep {rupees(order.grandTotal)} ready in Cash or
          UPI for when it arrives at your door.
        </p>
        <div className="success-receipt" data-testid="receipt-order">
          <span>Order #{orderNumber(order.id)}</span>
          <strong>{rupees(order.grandTotal)}</strong>
        </div>
        <button className="button-primary full-width" onClick={onDone} data-testid="button-continue-shopping">
          Back to catalog <ArrowRight size={17} />
        </button>
      </section>
    </div>
  );
}
