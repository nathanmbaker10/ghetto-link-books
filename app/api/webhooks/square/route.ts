import { NextResponse } from "next/server";
import { WebhooksHelper } from "square";
import { fulfillPaidOrder } from "@/lib/fulfill";
import { getSiteUrl } from "@/lib/square";

type Json = Record<string, unknown>;

export async function POST(request: Request) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const body = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature") ?? "";

  if (signatureKey) {
    const valid = await WebhooksHelper.verifySignature({
      requestBody: body,
      signatureHeader: signature,
      signatureKey,
      notificationUrl: `${getSiteUrl()}/api/webhooks/square`,
    });
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }
  }

  let payload: Json;
  try {
    payload = JSON.parse(body) as Json;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const type = String(payload.type ?? "");
  const paymentEvents = new Set([
    "payment.updated",
    "payment.created",
  ]);
  const orderEvents = new Set(["order.updated", "order.created"]);

  if (paymentEvents.has(type)) {
    const payment = nested(payload, ["data", "object", "payment"]) ??
      nested(payload, ["data", "object"]);
    const status = str(payment, "status");
    const orderId = str(payment, "orderId") ?? str(payment, "order_id");
    const email =
      str(payment, "buyerEmailAddress") ?? str(payment, "buyer_email_address");
    if (status === "COMPLETED" && orderId) {
      await fulfillPaidOrder(orderId, email);
    }
  } else if (orderEvents.has(type)) {
    const order =
      nested(payload, ["data", "object", "order"]) ??
      nested(payload, ["data", "object", "order_updated"]) ??
      nested(payload, ["data", "object"]);
    const orderId = str(order, "orderId") ?? str(order, "order_id") ?? str(order, "id");
    if (orderId) {
      await fulfillPaidOrder(orderId);
    }
  }

  return NextResponse.json({ ok: true });
}

function nested(value: unknown, path: string[]): Json | undefined {
  let current: unknown = value;
  for (const key of path) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = (current as Json)[key];
  }
  if (!current || typeof current !== "object") {
    return undefined;
  }
  return current as Json;
}

function str(obj: Json | undefined, key: string): string | undefined {
  const value = obj?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
