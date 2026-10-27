import { HandCoins } from 'lucide-react';

/** The first thing a visitor sees on the customer homepage. Keep the wording exactly as the shop owner wrote it. */
export function WelcomeBanner() {
  return (
    <section className="welcome-banner" aria-label="Welcome to Anandham Store" data-testid="banner-welcome">
      <span className="welcome-banner-icon" aria-hidden="true">
        <HandCoins size={26} strokeWidth={1.8} />
      </span>
      <p>
        <strong>Welcome to Anandham Store!</strong> Browse our catalog, add items to your cart, and submit your order
        request. No online payments required—pay via Cash or UPI at your doorstep upon delivery!
      </p>
    </section>
  );
}
