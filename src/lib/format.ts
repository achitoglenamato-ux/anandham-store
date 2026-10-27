/** Formats a rupee amount, e.g. 30 -> "₹30", 32.5 -> "₹32.50". */
export const rupees = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

/** Money is added up in whole paise (₹1 = 100 paise) so totals never show floating-point drift. */
export const toPaise = (amount: number): number => Math.round(amount * 100);
export const fromPaise = (paise: number): number => paise / 100;

/** Short, readable order number shown to the customer and the owner (the full id is long). */
export const orderNumber = (id: string): string => id.slice(0, 6).toUpperCase();

/** An error whose message is already written for the shopper. */
export class FriendlyError extends Error {}

const NETWORK_MESSAGE = 'Cannot reach the store right now. Please check your internet connection and try again.';
const WRONG_LOGIN = 'Incorrect email or password.';

const CODE_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': WRONG_LOGIN,
  'auth/wrong-password': WRONG_LOGIN,
  'auth/user-not-found': WRONG_LOGIN,
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/email-already-in-use': 'An account with this email already exists. Please log in instead.',
  'auth/weak-password': 'Your password must be at least 8 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/user-disabled': 'This account has been disabled. Please contact the shop.',
  'auth/network-request-failed': NETWORK_MESSAGE,
  'auth/operation-not-allowed':
    'Email sign-in is not switched on yet. The shop owner needs to enable Email/Password in Firebase Authentication.',
  'auth/configuration-not-found':
    'Email sign-in is not switched on yet. The shop owner needs to enable Email/Password in Firebase Authentication.',
  unavailable: NETWORK_MESSAGE,
  'deadline-exceeded': NETWORK_MESSAGE,
  'permission-denied': 'You are not allowed to do that. Please log in again, or ask the shop owner to check the database rules.',
  unauthenticated: 'Please log in and try again.',
};

function errorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object') {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return undefined;
}

/** True when the problem is "you are not signed in / not allowed" rather than a network or data problem. */
export function isPermissionProblem(error: unknown): boolean {
  const code = errorCode(error);
  return code === 'permission-denied' || code === 'unauthenticated';
}

/** A message that is safe and useful to show a shopper. */
export function errorMessage(error: unknown): string {
  if (error instanceof FriendlyError) return error.message;
  const code = errorCode(error);
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];
  if (error instanceof TypeError) return NETWORK_MESSAGE;
  return 'Something went wrong. Please try again.';
}

/** 10 digits, optional +91 / country code, spaces or dashes allowed. */
export const PHONE_PATTERN = /^\+?[0-9][0-9 -]{8,18}$/;

/** Only allow redirects back into this app (blocks "//evil.com" style open redirects). */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return null;
  return next;
}
