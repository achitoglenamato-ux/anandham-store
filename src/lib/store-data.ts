import {
  addDoc, collection, deleteDoc, deleteField, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc,
  writeBatch, type DocumentData, type Timestamp,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { slugify, STARTING_CATALOGUE } from './catalogue';
import { db } from './firebase';
import { FriendlyError, fromPaise, PHONE_PATTERN, toPaise } from './format';
import type { AdminOrder, OrderConfirmation, OrderItem, OrderStatus, Product, User } from './types';

/* ------------------------------------------------------------ live data hook */

type Live<T> = {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
};

/** Subscribes to a Firestore query and keeps the list up to date in real time. */
function useLive<T>(subscribe: (onData: (value: T) => void, onError: (error: unknown) => void) => () => void): Live<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<unknown>();
  const [isLoading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    return subscribe(
      value => {
        setData(value);
        setLoading(false);
      },
      problem => {
        console.error(problem);
        setError(problem);
        setLoading(false);
      },
    );
    // `subscribe` is a fresh function each render, but it only ever describes the same query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  return { data, isLoading, isError: error !== undefined, error, refetch: () => setAttempt(n => n + 1) };
}

/* ------------------------------------------------------------------ products */

function toProduct(id: string, raw: DocumentData): Product | null {
  const { name, category, unit, price, order, image } = raw;
  if (typeof name !== 'string' || typeof category !== 'string' || typeof unit !== 'string') return null;
  if (typeof price !== 'number' || !Number.isFinite(price)) return null;
  return {
    id, name, category, unit, price,
    order: typeof order === 'number' ? order : 0,
    image: typeof image === 'string' && image.startsWith('data:image/') ? image : undefined,
  };
}

/** All products, in display order, updating live whenever the owner changes a price. */
export function useProducts(): Live<Product[]> {
  return useLive<Product[]>((onData, onError) =>
    onSnapshot(
      collection(db, 'products'),
      snapshot => {
        const products = snapshot.docs
          .map(item => toProduct(item.id, item.data()))
          .filter((item): item is Product => item !== null)
          .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
        onData(products);
      },
      onError,
    ),
  );
}

export async function updateProductPrice(id: string, price: number): Promise<void> {
  if (!Number.isFinite(price) || price < 0 || price > 1_000_000) {
    throw new FriendlyError('Please enter a price between ₹0 and ₹10,00,000.');
  }
  await updateDoc(doc(db, 'products', id), { price: fromPaise(toPaise(price)) });
}

export async function addProduct(
  fields: { name: string; category: string; unit: string; price: number; image?: string },
  existing: Product[],
): Promise<void> {
  const name = fields.name.trim();
  const category = fields.category.trim().toUpperCase();
  const unit = fields.unit.trim();
  if (!name || !category || !unit) throw new FriendlyError('Please fill in the name, category and pack size.');
  if (!Number.isFinite(fields.price) || fields.price < 0 || fields.price > 1_000_000) {
    throw new FriendlyError('Please enter a price between ₹0 and ₹10,00,000.');
  }
  const id = slugify(name);
  if (existing.some(item => item.id === id || item.name.toLowerCase() === name.toLowerCase())) {
    throw new FriendlyError('A product with this name already exists.');
  }
  // New items go at the end of their category, or at the very end for a new category.
  const sameCategory = existing.filter(item => item.category === category);
  const order = sameCategory.length
    ? Math.max(...sameCategory.map(item => item.order)) + 1
    : Math.max(0, ...existing.map(item => item.order)) + 100;
  await setDoc(doc(db, 'products', id), {
    name, category, unit, price: fromPaise(toPaise(fields.price)), order,
    ...(fields.image ? { image: fields.image } : {}),
  });
}

/** Saves a product picture, or removes it when `image` is null (the emoji is shown again). */
export async function updateProductImage(id: string, image: string | null): Promise<void> {
  await updateDoc(doc(db, 'products', id), { image: image ?? deleteField() });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, 'products', id));
}

/** Adds the starting catalogue. Items that already exist are left alone, so edited prices are never reset. */
export async function loadStartingCatalogue(existing: Product[]): Promise<number> {
  const have = new Set(existing.map(item => item.id));
  const batch = writeBatch(db);
  let added = 0;
  STARTING_CATALOGUE.forEach((item, index) => {
    const id = slugify(item.name);
    if (have.has(id)) return;
    batch.set(doc(db, 'products', id), { ...item, order: (index + 1) * 10 });
    added += 1;
  });
  if (added > 0) await batch.commit();
  return added;
}

/* -------------------------------------------------------------------- orders */

/**
 * Pay-on-delivery checkout. No payment provider is involved: the order is saved and the customer
 * pays cash or UPI at the door. Prices are re-read from the database right before saving, so a stale
 * page never uses an old price.
 */
export async function placeOrder(
  user: User,
  details: { name: string; phone: string; address: string },
  lines: { productId: string; quantity: number }[],
): Promise<OrderConfirmation> {
  const name = details.name.trim();
  const phone = details.phone.trim();
  const address = details.address.trim();
  if (name.length < 2) throw new FriendlyError('Please enter your full name.');
  if (!PHONE_PATTERN.test(phone)) throw new FriendlyError('Please enter a valid phone / WhatsApp number (10 digits).');
  if (address.length < 8) throw new FriendlyError('Please enter your complete delivery address.');
  if (lines.length === 0 || lines.length > 50) throw new FriendlyError('Your basket must have between 1 and 50 items.');

  const snapshots = await Promise.all(lines.map(line => getDoc(doc(db, 'products', line.productId))));
  let grandTotalPaise = 0;
  const items: OrderItem[] = [];
  for (const [index, line] of lines.entries()) {
    const product = snapshots[index].exists() ? toProduct(line.productId, snapshots[index].data()!) : null;
    if (!product) {
      throw new FriendlyError('One of the items in your basket is no longer available. Please refresh and try again.');
    }
    const quantity = Math.min(99, Math.max(1, Math.floor(line.quantity)));
    const linePaise = toPaise(product.price) * quantity;
    grandTotalPaise += linePaise;
    items.push({
      productId: product.id,
      name: product.name,
      unit: product.unit,
      price: product.price,
      quantity,
      lineTotal: fromPaise(linePaise),
    });
  }

  const grandTotal = fromPaise(grandTotalPaise);
  // Field names must match the rules in firestore.rules exactly.
  const created = await addDoc(collection(db, 'orders'), {
    uid: user.id,
    customerName: name,
    customerPhone: phone,
    customerEmail: user.email,
    customerAddress: address,
    items,
    grandTotal,
    status: 'new',
    createdAt: serverTimestamp(),
  });
  return { id: created.id, grandTotal, status: 'new', createdAt: new Date().toISOString() };
}

const STATUSES: OrderStatus[] = ['new', 'called', 'completed', 'cancelled'];

function toAdminOrder(id: string, raw: DocumentData): AdminOrder {
  const created = raw.createdAt as Timestamp | null | undefined;
  return {
    id,
    customerName: String(raw.customerName ?? ''),
    customerPhone: String(raw.customerPhone ?? ''),
    customerEmail: String(raw.customerEmail ?? ''),
    customerAddress: String(raw.customerAddress ?? ''),
    items: Array.isArray(raw.items) ? (raw.items as OrderItem[]) : [],
    grandTotal: typeof raw.grandTotal === 'number' ? raw.grandTotal : 0,
    status: STATUSES.includes(raw.status) ? raw.status : 'new',
    createdAt: (created?.toDate ? created.toDate() : new Date()).toISOString(),
  };
}

/** Every customer order, newest first, updating live as new orders arrive. Owner only (enforced by the rules). */
export function useAdminOrders(): Live<AdminOrder[]> {
  return useLive<AdminOrder[]>((onData, onError) =>
    onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      snapshot => onData(snapshot.docs.map(item => toAdminOrder(item.id, item.data()))),
      onError,
    ),
  );
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await updateDoc(doc(db, 'orders', id), { status });
}

/** The three numbers on the owner's dashboard. */
export function summarise(orders: AdminOrder[]) {
  let totalSalesPaise = 0;
  let newOrders = 0;
  for (const order of orders) {
    if (order.status === 'new') newOrders += 1;
    if (order.status === 'completed') totalSalesPaise += toPaise(order.grandTotal);
  }
  return { totalOrders: orders.length, newOrders, totalSales: fromPaise(totalSalesPaise) };
}
