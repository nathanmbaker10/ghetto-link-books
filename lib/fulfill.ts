import { getBooksByIds, getBooksByTitles } from "@/data/books";
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
  order: {
    metadata?: Record<string, string | null> | null;
    ticketName?: string | null;
    tenders?: Array<{ id?: string; paymentId?: string | null; note?: string | null }> | null;
  },
  fallbackEmail?: string,
): Promise<string | undefined> {
  const fromMetadata = order.metadata?.buyer_email?.trim();
  if (fromMetadata?.includes("@")) {
    return fromMetadata;
  }

  const fromTicket = order.ticketName?.trim();
  if (fromTicket?.includes("@")) {
    return fromTicket;
  }

  if (fallbackEmail?.includes("@")) {
    return fallbackEmail.trim();
  }

  const client = getSquareClient();
  const paymentIds = [
    ...new Set(
      (order.tenders ?? [])
        .flatMap((tender) => [tender.paymentId, tender.id])
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  for (const paymentId of paymentIds) {
    try {
      const { payment } = await client.payments.get({ paymentId });
      const email =
        payment?.buyerEmailAddress?.trim() ||
        parseDeliveryEmail(payment?.note);
      if (email) {
        return email;
      }
    } catch (error) {
      console.error(error);
    }
  }

  for (const tender of order.tenders ?? []) {
    const email = parseDeliveryEmail(tender.note);
    if (email) {
      return email;
    }
  }

  return undefined;
}

function parseDeliveryEmail(note?: string | null): string | undefined {
  const match = note?.match(/Digital delivery to\s+(\S+@\S+)/i);
  return match?.[1];
}

export async function fulfillPaidOrder(
  orderId: string,
  fallbackEmail?: string,
): Promise<FulfillResult> {
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

  let retries = 0;
  while (!isOrderPaid(order)) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      const refreshed = await client.orders.get({ orderId });
      if (!refreshed.order) {
        return { status: "missing" };
      }
      order = refreshed.order;
    } catch (error) {
      console.error(error);
      return { status: "unpaid" };
    }
    retries += 1;
    if (retries >= 5) {
      break;
    }
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
  const titles = (order.lineItems ?? [])
    .map((item) => item.name)
    .filter((name): name is string => Boolean(name));
  const selectedBooks =
    getBooksByIds(bookIds).length > 0
      ? getBooksByIds(bookIds)
      : getBooksByTitles(titles);
  if (selectedBooks.length === 0) {
    return { status: "missing" };
  }

  let email: string | undefined;
  try {
    email = await getBuyerEmail(order, fallbackEmail);
  } catch (error) {
    console.error(error);
  }

  if (!email) {
    const shopInbox = process.env.EMAIL_REPLY_TO ?? "ghettolink22@gmail.com";
    await sendOrderEmail({
      to: shopInbox,
      books: selectedBooks,
      totalCents: totalCents(selectedBooks.length),
    });
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

  if (order.version != null && order.locationId) {
    try {
      await client.orders.update({
        orderId,
        order: {
          locationId: order.locationId,
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
