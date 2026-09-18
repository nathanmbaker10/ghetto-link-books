import { getBooksByIds } from "@/data/books";
import { sendOrderEmail } from "@/lib/email";
import { getOrder, getOrderByRef, markOrderEmailed } from "@/lib/orders";
import { totalCents } from "@/lib/pricing";
import { getSquareClient } from "@/lib/square";

export type FulfillResult =
  | { status: "sent" }
  | { status: "already" }
  | { status: "unpaid" }
  | { status: "missing" }
  | { status: "email_failed"; error: string };

export async function isSquareOrderPaid(orderId: string): Promise<boolean> {
  const client = getSquareClient();
  const { order } = await client.orders.get({ orderId });
  if (!order) {
    return false;
  }
  if (order.state === "COMPLETED") {
    return true;
  }
  if ((order.tenders ?? []).length > 0) {
    return true;
  }
  return false;
}

export async function fulfillByCheckoutRef(
  checkoutRef: string,
): Promise<FulfillResult> {
  const stored = getOrderByRef(checkoutRef);
  if (!stored) {
    return { status: "missing" };
  }
  return fulfillPaidOrder(stored.orderId);
}

export async function fulfillPaidOrder(orderId: string): Promise<FulfillResult> {
  const stored = getOrder(orderId);
  if (!stored) {
    return { status: "missing" };
  }
  if (stored.emailSentAt) {
    return { status: "already" };
  }

  try {
    const paid = await isSquareOrderPaid(orderId);
    if (!paid) {
      return { status: "unpaid" };
    }
  } catch (error) {
    console.error(error);
    return { status: "unpaid" };
  }

  const books = getBooksByIds(stored.bookIds);
  const { error } = await sendOrderEmail({
    to: stored.email,
    books,
    totalCents: totalCents(books.length),
  });

  if (error) {
    return { status: "email_failed", error };
  }

  markOrderEmailed(orderId);
  return { status: "sent" };
}
