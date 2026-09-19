import { getBooksByIds } from "@/data/books";
import { sendOrderEmail } from "@/lib/email";
import { totalCents } from "@/lib/pricing";
import { getSquareClient } from "@/lib/square";

export type FulfillResult =
  | { status: "sent" }
  | { status: "already" }
  | { status: "unpaid" }
  | { status: "missing" }
  | { status: "email_failed"; error: string };

function isOrderPaid(order: {
  state?: string;
  tenders?: unknown[] | null;
}): boolean {
  if (order.state === "COMPLETED") {
    return true;
  }
  return (order.tenders ?? []).length > 0;
}

async function getBuyerEmail(
  order: { tenders?: Array<{ id?: string }> | null },
): Promise<string | undefined> {
  const client = getSquareClient();
  for (const tender of order.tenders ?? []) {
    if (!tender.id) {
      continue;
    }
    const { payment } = await client.payments.get({ paymentId: tender.id });
    const email = payment?.buyerEmailAddress?.trim();
    if (email) {
      return email;
    }
  }
  return undefined;
}

export async function fulfillPaidOrder(orderId: string): Promise<FulfillResult> {
  const client = getSquareClient();
  let order;
  try {
    ({ order } = await client.orders.get({ orderId }));
  } catch (error) {
    console.error(error);
    return { status: "missing" };
  }

  if (!order) {
    return { status: "missing" };
  }

  if (order.metadata?.emailed === "1") {
    return { status: "already" };
  }

  if (!isOrderPaid(order)) {
    return { status: "unpaid" };
  }

  const bookIds = (order.lineItems ?? [])
    .map((item) => item.note)
    .filter((note): note is string => Boolean(note));
  const selectedBooks = getBooksByIds(bookIds);
  if (selectedBooks.length === 0) {
    return { status: "missing" };
  }

  let email: string | undefined;
  try {
    email = await getBuyerEmail(order);
  } catch (error) {
    console.error(error);
  }

  if (!email) {
    return {
      status: "email_failed",
      error: "Square did not return the buyer email for this payment.",
    };
  }

  const { error } = await sendOrderEmail({
    to: email,
    books: selectedBooks,
    totalCents: totalCents(selectedBooks.length),
  });

  if (error) {
    return { status: "email_failed", error };
  }

  if (order.version != null) {
    try {
      await client.orders.update({
        orderId,
        order: {
          version: order.version,
          metadata: {
            ...order.metadata,
            emailed: "1",
          },
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  return { status: "sent" };
}
