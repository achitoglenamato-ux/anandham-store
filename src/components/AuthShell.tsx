import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { Brand } from './Brand';

/** Shared two-column layout for the login and registration pages. */
export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-page">
      <div className="auth-back">
        <Brand />
        <Link href="/" className="back-to-shop" data-testid="link-back-to-shop">
          <ArrowLeft size={15} /> Back to catalog
        </Link>
      </div>
      <div className="auth-layout">
        <div className="auth-aside">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
        <div className="auth-card-wrap">
          <div className="auth-card">{children}</div>
        </div>
      </div>
    </div>
  );
}
