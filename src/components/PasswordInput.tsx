import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export function PasswordInput({
  value,
  onChange,
  autoComplete,
  minLength,
  testId,
}: {
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  minLength?: number;
  testId: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="password-field">
      <input
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={event => onChange(event.target.value)}
        required
        minLength={minLength}
        maxLength={128}
        data-testid={testId}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible(current => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </span>
  );
}
