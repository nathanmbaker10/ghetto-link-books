import { createHmac, timingSafeEqual } from "crypto";

export type ReadTokenPayload = {
  orderId: string;
  bookId: string;
  email: string;
};

function getSecret(): string | undefined {
  const secret = process.env.READ_TOKEN_SECRET?.trim();
  return secret || undefined;
}

export function isReadTokenConfigured(): boolean {
  return Boolean(getSecret());
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function signReadToken(payload: ReadTokenPayload): string | undefined {
  const secret = getSecret();
  if (!secret) {
    return undefined;
  }

  const body = Buffer.from(
    JSON.stringify({
      o: payload.orderId,
      b: payload.bookId,
      e: normalizeEmail(payload.email),
    }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyReadToken(token: string): ReadTokenPayload | undefined {
  const secret = getSecret();
  if (!secret) {
    return undefined;
  }

  const decoded = decodeURIComponent(token);
  const [body, sig] = decoded.split(".");
  if (!body || !sig) {
    return undefined;
  }

  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  if (!safeEqual(sig, expected)) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      o?: unknown;
      b?: unknown;
      e?: unknown;
    };
    if (
      typeof parsed.o !== "string" ||
      typeof parsed.b !== "string" ||
      typeof parsed.e !== "string"
    ) {
      return undefined;
    }
    return {
      orderId: parsed.o,
      bookId: parsed.b,
      email: normalizeEmail(parsed.e),
    };
  } catch {
    return undefined;
  }
}

export function readCookieName(orderId: string): string {
  const secret = getSecret() ?? "missing";
  const digest = createHmac("sha256", secret).update(orderId).digest("hex");
  return `glb_${digest.slice(0, 16)}`;
}

export function readCookieValue(orderId: string, email: string): string {
  const secret = getSecret() ?? "missing";
  return createHmac("sha256", secret)
    .update(`cookie:${orderId}:${normalizeEmail(email)}`)
    .digest("base64url");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
