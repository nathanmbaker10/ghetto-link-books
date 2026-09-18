import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export type StoredOrder = {
  orderId: string;
  checkoutRef: string;
  email: string;
  bookIds: string[];
  emailSentAt?: string;
};

const ordersPath = path.join(process.cwd(), ".data", "orders.json");

function readAll(): Record<string, StoredOrder> {
  try {
    return JSON.parse(readFileSync(ordersPath, "utf8")) as Record<
      string,
      StoredOrder
    >;
  } catch {
    return {};
  }
}

function writeAll(orders: Record<string, StoredOrder>) {
  mkdirSync(path.dirname(ordersPath), { recursive: true });
  writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
}

export function saveOrder(order: StoredOrder) {
  const orders = readAll();
  orders[order.orderId] = { ...orders[order.orderId], ...order };
  writeAll(orders);
}

export function getOrder(orderId: string): StoredOrder | undefined {
  return readAll()[orderId];
}

export function getOrderByRef(checkoutRef: string): StoredOrder | undefined {
  return Object.values(readAll()).find(
    (order) => order.checkoutRef === checkoutRef,
  );
}

export function markOrderEmailed(orderId: string) {
  const orders = readAll();
  const existing = orders[orderId];
  if (!existing) {
    return;
  }
  orders[orderId] = { ...existing, emailSentAt: new Date().toISOString() };
  writeAll(orders);
}
