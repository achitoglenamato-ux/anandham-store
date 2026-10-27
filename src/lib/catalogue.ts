/**
 * Anandham Store's starting catalogue (prices in rupees). The owner can load it into the database with
 * one click on the Owner desk → "Product prices" tab, then change prices or add items there.
 * The array order is the display order.
 */
export type CatalogueItem = { category: string; name: string; unit: string; price: number };

export const STARTING_CATALOGUE: CatalogueItem[] = [
  // DAIRY
  { category: 'DAIRY', name: 'Fresh Milk', unit: '500 ml pocket', price: 30 },
  { category: 'DAIRY', name: 'Premium Curd', unit: '200g cup', price: 25 },
  { category: 'DAIRY', name: 'Pure Cow Ghee', unit: '500 ml jar', price: 340 },
  // SNACKS
  { category: 'SNACKS', name: 'Potato Chips', unit: '100g packet', price: 40 },
  { category: 'SNACKS', name: 'Mixture / Sev', unit: '250g bag', price: 60 },
  { category: 'SNACKS', name: 'Marie Biscuits', unit: '250g twin pack', price: 30 },
  // SPICES
  { category: 'SPICES', name: 'Turmeric Powder', unit: '100g box', price: 35 },
  { category: 'SPICES', name: 'Sambar Powder', unit: '200g box', price: 75 },
  { category: 'SPICES', name: 'Whole Black Pepper', unit: '100g pocket', price: 90 },
  // COOL DRINKS
  { category: 'COOL DRINKS', name: 'Mango Juice', unit: '1 Litre bottle', price: 70 },
  { category: 'COOL DRINKS', name: 'Lemon Fizz', unit: '500 ml bottle', price: 40 },
  // VEGETABLES AND FRUITS
  { category: 'VEGETABLES AND FRUITS', name: 'Fresh Onions', unit: '1 kg', price: 45 },
  { category: 'VEGETABLES AND FRUITS', name: 'Country Tomatoes', unit: '1 kg', price: 50 },
  { category: 'VEGETABLES AND FRUITS', name: 'Cavendish Bananas', unit: '1 Dozen', price: 60 },
  // FLOURS
  { category: 'FLOURS', name: 'Whole Wheat Atta', unit: '5 kg bag', price: 240 },
  { category: 'FLOURS', name: 'Rice Flour / Idli Rice Atta', unit: '1 kg pocket', price: 55 },
  // DHALS
  { category: 'DHALS', name: 'Toor Dal / Arhar', unit: '1 kg pocket', price: 165 },
  { category: 'DHALS', name: 'Chana Dal', unit: '1 kg pocket', price: 110 },
];

/** Stable document id from a product name, so loading the catalogue twice never creates duplicates. */
export const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'item';
