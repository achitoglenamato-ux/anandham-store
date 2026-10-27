import { ArrowRight } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, Redirect, useSearch } from 'wouter';
import { AuthShell } from '@/components/AuthShell';
import { PasswordInput } from '@/components/PasswordInput';
import { useAuth } from '@/lib/auth';
import { errorMessage, safeNextPath } from '@/lib/format';
import type { User } from '@/lib/types';

export default function LoginPage() {
  const { user, signIn, sendReset } = useAuth();
  const search = useSearch();
  const next = safeNextPath(new URLSearchParams(search).get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // The shop owner lands on the owner desk; customers go back where they came from.
  const destination = (signedIn: User) => (signedIn.role === 'admin' ? '/admin' : (next ?? '/'));

  if (user) return <Redirect to={destination(user)} replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError('');
    setNotice('');
    try {
      await signIn(email, password);
    } catch (problem) {
      setError(errorMessage(problem));
    } finally {
      setPending(false);
    }
  };

  const forgotPassword = async () => {
    setError('');
    setNotice('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Type your email address above first, then tap “Forgot password?”.');
      return;
    }
    try {
      await sendReset(email);
      setNotice(`If ${email.trim()} has an account, a password reset link is on its way. Please check your inbox and spam folder.`);
    } catch (problem) {
      setError(errorMessage(problem));
    }
  };

  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : '/register';

  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title={
        <>
          Log in to
          <br />
          <em>Anandham Store.</em>
        </>
      }
      intro="Sign in with your email and password to place your order. Your basket is saved."
    >
      <h2>Log in</h2>
      <form onSubmit={submit} className="checkout-form auth-form">
        <label>
          Email ID
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            maxLength={254}
            data-testid="input-login-email"
          />
        </label>
        <label>
          Password
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            testId="input-login-password"
          />
        </label>
        <button type="button" className="link-button" onClick={forgotPassword} data-testid="button-forgot-password">
          Forgot password?
        </button>
        {error && (
          <p className="form-error" role="alert" data-testid="text-login-error">
            {error}
          </p>
        )}
        {notice && (
          <p className="form-hint form-notice" role="status" data-testid="text-login-notice">
            {notice}
          </p>
        )}
        <button className="button-primary full-width" type="submit" disabled={pending} data-testid="button-login">
          {pending ? (
            'Logging in…'
          ) : (
            <>
              Log in <ArrowRight size={17} />
            </>
          )}
        </button>
        <p className="auth-switch">
          New to Anandham Store?{' '}
          <Link href={registerHref} data-testid="link-to-register">
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
