import { getBooksByIds, getBooksByTitles } from "@/data/books";
import { getSquareClient } from "@/lib/square";

export function isOrderPaid(order: {
  state?: string;
  tenders?: unknown[] | null;
}): boolean {
  if (order.state === "COMPLETED") {
    return true;
  }
  return (order.tenders ?? []).length > 0;
}

export function booksOnOrder(order: {
  lineItems?: Array<{ note?: string | null; name?: string | null }> | null;
}) {
  const bookIds = (order.lineItems ?? [])
    .map((item) => item.note)
    .filter((note): note is string => Boolean(note));
  const titles = (order.lineItems ?? [])
    .map((item) => item.name)
    .filter((name): name is string => Boolean(name));
  const byId = getBooksByIds(bookIds);
  return byId.length > 0 ? byId : getBooksByTitles(titles);
}

export async function loadReadableOrder(
  orderId: string,
  bookId: string,
): Promise<"ok" | "unpaid" | "missing"> {
  const client = getSquareClient();
  let order;
  try {
    ({ order } = await client.orders.get({ orderId }));
  } catch (error) {
    console.error(error);
    return "missing";
  }

  if (!order) {
    return "missing";
  }

  if (!isOrderPaid(order)) {
    return "unpaid";
  }

  const purchased = booksOnOrder(order);
  if (!purchased.some((book) => book.id === bookId)) {
    return "missing";
  }

  return "ok";
}
