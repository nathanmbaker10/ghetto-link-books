import { NextResponse } from "next/server";
import { WebhooksHelper } from "square";
import { fulfillPaidOrder } from "@/lib/fulfill";
import { getSiteUrl } from "@/lib/square";

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

  let payload: {
    type?: string;
    data?: {
      object?: {
        payment?: {
          status?: string;
          order_id?: string;
          orderId?: string;
        };
      };
    };
  };

  try {
    payload = JSON.parse(body) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (payload.type !== "payment.updated") {
    return NextResponse.json({ ok: true });
  }

  const payment = payload.data?.object?.payment;
  const orderId = payment?.orderId ?? payment?.order_id;
  if (payment?.status === "COMPLETED" && orderId) {
    await fulfillPaidOrder(orderId);
  }

  return NextResponse.json({ ok: true });
}
