import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { SquareError } from "square";
import { getBooksByIds } from "@/data/books";
import {
  BOOK_PRICE_CENTS,
  freeBookCount,
  totalCents,
} from "@/lib/pricing";
import {
  getSiteUrl,
  getSquareClient,
  getSquareLocationId,
  isSquareConfigured,
} from "@/lib/square";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CheckoutBody = {
  bookIds?: unknown;
  email?: unknown;
};

export async function POST(request: Request) {
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!emailPattern.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email so we can send your files." },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.bookIds) || body.bookIds.length === 0) {
    return NextResponse.json(
      { error: "Select at least one book." },
      { status: 400 },
    );
  }

  const uniqueIds = [
    ...new Set(
      body.bookIds.filter((id): id is string => typeof id === "string"),
    ),
  ];
  const selectedBooks = getBooksByIds(uniqueIds);

  if (selectedBooks.length !== uniqueIds.length) {
    return NextResponse.json(
      { error: "One or more selected books are not in the catalog." },
      { status: 400 },
    );
  }

  if (!isSquareConfigured()) {
    return NextResponse.json(
      {
        error: "Checkout is not configured yet. Add Square credentials in the host environment.",
      },
      { status: 503 },
    );
  }

  const count = selectedBooks.length;
  const free = freeBookCount(count);
  const amountCents = totalCents(count);

  if (amountCents <= 0) {
    return NextResponse.json(
      { error: "Cart total must be greater than zero." },
      { status: 400 },
    );
  }

  try {
    const checkoutRef = randomUUID();
    const siteUrl = getSiteUrl();
    const client = getSquareClient();
    const locationId = getSquareLocationId();

    const response = await client.checkout.paymentLinks.create({
      idempotencyKey: randomUUID(),
      description: "Ghetto Link Books digital short stories",
      paymentNote: `Digital delivery to ${email}`,
      order: {
        locationId,
        referenceId: checkoutRef,
        metadata: {
          buyer_email: email.slice(0, 255),
        },
        ticketName: email.slice(0, 255),
        lineItems: selectedBooks.map((book) => ({
          name: book.title,
          quantity: "1",
          note: book.id,
          basePriceMoney: {
            amount: BigInt(BOOK_PRICE_CENTS),
            currency: "USD",
          },
        })),
        discounts:
          free > 0
            ? [
                {
                  name: "Buy 2 get 1 free",
                  type: "FIXED_AMOUNT",
                  scope: "ORDER",
                  amountMoney: {
                    amount: BigInt(free * BOOK_PRICE_CENTS),
                    currency: "USD",
                  },
                },
              ]
            : undefined,
      },
      checkoutOptions: {
        askForShippingAddress: false,
        redirectUrl: `${siteUrl}/success?email=${encodeURIComponent(email)}`,
        acceptedPaymentMethods: {
          cashAppPay: true,
        },
      },
      prePopulatedData: {
        buyerEmail: email,
      },
    });

    const paymentLink = response.paymentLink;
    const url = paymentLink?.url;
    const orderId = paymentLink?.orderId;
    if (!url || !orderId || !paymentLink.id || paymentLink.version == null) {
      return NextResponse.json(
        { error: "Square did not return a checkout URL." },
        { status: 502 },
      );
    }

    await client.checkout.paymentLinks.update({
      id: paymentLink.id,
      paymentLink: {
        version: paymentLink.version,
        checkoutOptions: {
          redirectUrl: `${siteUrl}/success?orderId=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`,
        },
      },
    });

    const created = await client.orders.get({ orderId });
    if (created.order?.version != null && created.order.locationId) {
      await client.orders.update({
        orderId,
        order: {
          locationId: created.order.locationId,
          version: created.order.version,
          metadata: {
            ...created.order.metadata,
            buyer_email: email.slice(0, 255),
          },
          ticketName: email.slice(0, 255),
        },
      });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error(error);
    if (error instanceof SquareError) {
      return NextResponse.json(
        { error: "Square could not create the checkout. Check your credentials." },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: "Could not start checkout. Try again." },
      { status: 500 },
    );
  }
}
