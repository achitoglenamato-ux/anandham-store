import { Route, Router as WouterRouter, Switch } from 'wouter';
import { AuthProvider } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';
import { isFirebaseConfigured } from '@/lib/firebase-config';
import { useHashLocation, useHashSearch } from '@/lib/hash-location';
import AdminPage from '@/pages/Admin';
import LoginPage from '@/pages/Login';
import NotFound from '@/pages/not-found';
import RegisterPage from '@/pages/Register';
import SetupNeeded from '@/pages/SetupNeeded';
import Storefront from '@/pages/Storefront';
import './index.css';

function App() {
  // Until the Firebase settings are pasted into src/lib/firebase-config.ts, show a clear setup page
  // instead of a broken store.
  if (!isFirebaseConfigured) return <SetupNeeded />;

  return (
    <AuthProvider>
      <CartProvider>
        <WouterRouter hook={useHashLocation} searchHook={useHashSearch}>
          <Switch>
            <Route path="/" component={Storefront} />
            <Route path="/login" component={LoginPage} />
            <Route path="/register" component={RegisterPage} />
            <Route path="/admin" component={AdminPage} />
            <Route component={NotFound} />
          </Switch>
        </WouterRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
