export const BOOK_PRICE_CENTS = 1000;

export function freeBookCount(count: number): number {
  if (count < 0 || !Number.isInteger(count)) {
    return 0;
  }
  return Math.floor(count / 3);
}

export function paidBookCount(count: number): number {
  return Math.max(0, count - freeBookCount(count));
}

export function totalCents(count: number): number {
  return paidBookCount(count) * BOOK_PRICE_CENTS;
}

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
