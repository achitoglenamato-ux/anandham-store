import { Store } from 'lucide-react';

/** Shown only until the Firebase settings are pasted into src/lib/firebase-config.ts. */
export default function SetupNeeded() {
  return (
    <div className="admin-auth-page">
      <div className="brand">
        <span className="brand-words">
          <strong>Anandham Store</strong>
        </span>
      </div>
      <div className="admin-auth-card" data-testid="panel-setup-needed">
        <span className="admin-lock">
          <Store size={24} />
        </span>
        <span className="eyebrow">ONE-TIME SETUP</span>
        <h1>
          Connect <em>Firebase.</em>
        </h1>
        <p>
          Open <b>src/lib/firebase-config.ts</b>, paste your Firebase web-app settings, then rebuild or push to
          GitHub. The README explains every step.
        </p>
      </div>
      <footer>ANANDHAM STORE</footer>
    </div>
  );
}
