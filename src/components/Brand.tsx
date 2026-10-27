import { ShoppingBasket } from 'lucide-react';
import { Link } from 'wouter';

export const STORE_NAME = 'Anandham Store';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${compact ? 'brand-compact' : ''}`}
      aria-label={`${STORE_NAME} home`}
      data-testid={compact ? 'link-brand-compact' : 'link-brand'}
    >
      <span className="brand-mark" aria-hidden="true">
        <ShoppingBasket size={21} strokeWidth={1.8} />
      </span>
      <span className="brand-words">
        <strong>{STORE_NAME}</strong>
        <small>YOUR NEIGHBOURHOOD GROCER</small>
      </span>
    </Link>
  );
}
