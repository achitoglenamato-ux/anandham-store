import { ShoppingBasket } from 'lucide-react';
import { Link } from 'wouter';
import { Brand } from '@/components/Brand';

export default function NotFound() {
  return (
    <div className="admin-auth-page">
      <Brand />
      <div className="admin-auth-card" data-testid="page-not-found">
        <span className="admin-lock">
          <ShoppingBasket size={24} />
        </span>
        <span className="eyebrow">ERROR 404</span>
        <h1>
          Page <em>not found.</em>
        </h1>
        <p>We couldn’t find the page you were looking for.</p>
        <Link href="/" className="button-primary full-width">
          Back to Anandham Store
        </Link>
      </div>
      <footer>ANANDHAM STORE</footer>
    </div>
  );
}
