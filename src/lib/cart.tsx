import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/** productId -> quantity */
type CartLines = Record<string, number>;

const STORAGE_KEY = 'anandham-store-cart-v2';
const MAX_PER_ITEM = 99;

function loadCart(): CartLines {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const lines: CartLines = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (key && Number.isInteger(value) && (value as number) > 0) {
        lines[key] = Math.min(MAX_PER_ITEM, value as number);
      }
    }
    return lines;
  } catch {
    return {};
  }
}

type CartContextValue = {
  lines: CartLines;
  count: number;
  add: (productId: string, amount: number) => void;
  change: (productId: string, delta: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/**
 * The basket lives in localStorage so it survives the trip to the login or
 * registration page (shoppers browse first, sign in at checkout).
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLines>(loadCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable (private mode): the basket still works for this visit */
    }
  }, [lines]);

  const add = useCallback((productId: string, amount: number) => {
    setLines(previous => ({
      ...previous,
      [productId]: Math.min(MAX_PER_ITEM, (previous[productId] ?? 0) + amount),
    }));
  }, []);

  const change = useCallback((productId: string, delta: number) => {
    setLines(previous => {
      const next = { ...previous };
      const quantity = (next[productId] ?? 0) + delta;
      if (quantity <= 0) delete next[productId];
      else next[productId] = Math.min(MAX_PER_ITEM, quantity);
      return next;
    });
  }, []);

  const clear = useCallback(() => setLines({}), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: Object.values(lines).reduce((sum, quantity) => sum + quantity, 0),
      add,
      change,
      clear,
    }),
    [lines, add, change, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}
