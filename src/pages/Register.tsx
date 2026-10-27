import { ArrowRight } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, Redirect, useSearch } from 'wouter';
import { AuthShell } from '@/components/AuthShell';
import { PasswordInput } from '@/components/PasswordInput';
import { useAuth } from '@/lib/auth';
import { PHONE_PATTERN, errorMessage, safeNextPath } from '@/lib/format';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const search = useSearch();
  const next = safeNextPath(new URLSearchParams(search).get('next'));
  const [fields, setFields] = useState({ name: '', phone: '', address: '', email: '', password: '' });
  const [validation, setValidation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Redirect to={user.role === 'admin' ? '/admin' : (next ?? '/')} replace />;

  const set = (key: keyof typeof fields) => (value: string) => setFields(current => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = fields.name.trim();
    const phone = fields.phone.trim();
    const address = fields.address.trim();
    const email = fields.email.trim();

    if (name.length < 2) return setValidation('Please enter your full name.');
    if (!PHONE_PATTERN.test(phone)) return setValidation('Please enter a valid phone / WhatsApp number (10 digits).');
    if (address.length < 8) return setValidation('Please enter your complete delivery address.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setValidation('Please enter a valid email address.');
    if (fields.password.length < 8) return setValidation('Your password must be at least 8 characters.');
    setValidation('');

    setPending(true);
    setError('');
    try {
      await register({ name, phone, address, email, password: fields.password });
    } catch (problem) {
      setError(errorMessage(problem));
    } finally {
      setPending(false);
    }
  };

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login';

  return (
    <AuthShell
      eyebrow="NEW CUSTOMER"
      title={
        <>
          Join
          <br />
          <em>Anandham Store.</em>
        </>
      }
      intro="Create a free account once. We keep your delivery details so ordering takes just a few taps."
    >
      <h2>Create your account</h2>
      <form onSubmit={submit} className="checkout-form auth-form" noValidate>
        <label>
          Full name
          <input
            autoComplete="name"
            value={fields.name}
            onChange={event => set('name')(event.target.value)}
            placeholder="e.g. Asha Raman"
            required
            maxLength={120}
            data-testid="input-register-name"
          />
        </label>
        <label>
          Active phone / WhatsApp number
          <input
            type="tel"
            autoComplete="tel"
            value={fields.phone}
            onChange={event => set('phone')(event.target.value)}
            placeholder="e.g. 98765 43210"
            required
            maxLength={20}
            data-testid="input-register-phone"
          />
        </label>
        <label>
          Complete delivery address
          <textarea
            autoComplete="street-address"
            value={fields.address}
            onChange={event => set('address')(event.target.value)}
            placeholder="House no., street, area, landmark, pincode"
            required
            maxLength={500}
            rows={3}
            data-testid="input-register-address"
          />
        </label>
        <label>
          Email ID
          <input
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={event => set('email')(event.target.value)}
            placeholder="you@example.com"
            required
            maxLength={254}
            data-testid="input-register-email"
          />
        </label>
        <label>
          Password
          <PasswordInput
            value={fields.password}
            onChange={set('password')}
            autoComplete="new-password"
            minLength={8}
            testId="input-register-password"
          />
        </label>
        <p className="form-hint">At least 8 characters.</p>

        {validation && (
          <p className="form-error" role="alert" data-testid="text-register-validation">
            {validation}
          </p>
        )}
        {error && (
          <p className="form-error" role="alert" data-testid="text-register-error">
            {error}
          </p>
        )}
        <button
          className="button-primary full-width"
          type="submit"
          disabled={pending}
          data-testid="button-register"
        >
          {pending ? (
            'Creating your account…'
          ) : (
            <>
              Create account <ArrowRight size={17} />
            </>
          )}
        </button>
        <p className="auth-switch">
          Already registered?{' '}
          <Link href={loginHref} data-testid="link-to-login">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
