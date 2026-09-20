import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { loadReadableOrder } from "@/lib/order-access";
import { getBookPdf } from "@/lib/pdf-store";
import {
  readCookieName,
  readCookieValue,
  verifyReadToken,
} from "@/lib/read-token";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const payload = verifyReadToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const jar = await cookies();
  const cookie = jar.get(readCookieName(payload.orderId));
  if (
    !cookie?.value ||
    cookie.value !== readCookieValue(payload.orderId, payload.email)
  ) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const access = await loadReadableOrder(payload.orderId, payload.bookId);
  if (access !== "ok") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pdf = await getBookPdf(payload.bookId);
  if ("missing" in pdf) {
    return NextResponse.json({ error: "Not uploaded yet." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(pdf.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
