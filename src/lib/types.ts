export type UserRole = 'admin' | 'customer';
export type OrderStatus = 'new' | 'called' | 'completed' | 'cancelled';

export type User = {
  /** Firebase Authentication user id */
  id: string;
  name: string;
  phone: string;
  address: string;
  email: string;
  role: UserRole;
};

/** Price is in rupees. `order` controls the display order in the catalogue. */
export type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  order: number;
};

export type OrderItem = {
  productId: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  lineTotal: number;
};

export type OrderConfirmation = {
  id: string;
  grandTotal: number;
  status: OrderStatus;
  createdAt: string;
};

export type AdminOrder = OrderConfirmation & {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  items: OrderItem[];
};
