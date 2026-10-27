import { LogOut, MapPin, ShoppingBag, UserRound } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth, useLogout } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { Brand } from './Brand';

export function SiteHeader({ onBasket }: { onBasket: () => void }) {
  const { user } = useAuth();
  const { count } = useCart();
  const { logout, isPending } = useLogout();
  const [, setLocation] = useLocation();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <div className="delivery-note">
          <MapPin size={16} />
          <span>PAY ON DELIVERY · CASH OR UPI</span>
        </div>
        <div className="header-actions">
          {user ? (
            <>
              <span className="header-greeting" data-testid="text-greeting">
                <UserRound size={15} /> Hi, {user.name.split(/\s+/)[0]}
              </span>
              {user.role === 'admin' && (
                <Link href="/admin" className="header-link" data-testid="link-owner-desk">
                  Owner desk
                </Link>
              )}
              <button
                className="header-link"
                onClick={() => logout(() => setLocation('/'))}
                disabled={isPending}
                data-testid="button-logout"
              >
                <LogOut size={14} /> Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="header-link" data-testid="link-login">
                Log in
              </Link>
              <Link href="/register" className="header-cta" data-testid="link-register">
                Register
              </Link>
            </>
          )}
          <button
            className="basket-button"
            onClick={onBasket}
            data-testid="button-open-basket"
            aria-label={`Open basket, ${count} items`}
          >
            <ShoppingBag size={18} />
            <span>Your basket</span>
            <b>{count}</b>
          </button>
        </div>
      </div>
    </header>
  );
}
