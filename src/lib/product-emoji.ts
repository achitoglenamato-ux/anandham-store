import type { Product } from './types';

const BY_KEYWORD: [RegExp, string][] = [
  [/milk/i, '🥛'],
  [/curd/i, '🥣'],
  [/ghee/i, '🧈'],
  [/chips/i, '🥔'],
  [/biscuit/i, '🍪'],
  [/mixture|sev/i, '🥨'],
  [/mango/i, '🥭'],
  [/lemon/i, '🍋'],
  [/onion/i, '🧅'],
  [/tomato/i, '🍅'],
  [/banana/i, '🍌'],
  [/pepper/i, '⚫'],
  [/turmeric|sambar/i, '🌶️'],
];

const BY_CATEGORY: Record<string, string> = {
  DAIRY: '🥛',
  SNACKS: '🍿',
  SPICES: '🌶️',
  'COOL DRINKS': '🥤',
  'VEGETABLES AND FRUITS': '🥕',
  FLOURS: '🌾',
  DHALS: '🫘',
};

/** Products have no image column, so we pick a friendly emoji from the name, then the category. */
export function productEmoji(product: Pick<Product, 'name' | 'category'>): string {
  const byName = BY_KEYWORD.find(([pattern]) => pattern.test(product.name));
  return byName?.[1] ?? BY_CATEGORY[product.category.toUpperCase()] ?? '🛒';
}
