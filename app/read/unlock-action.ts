"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loadReadableOrder } from "@/lib/order-access";
import {
  normalizeEmail,
  readCookieName,
  readCookieValue,
  sessionCookieOptions,
  verifyReadToken,
} from "@/lib/read-token";

export async function unlockReader(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const email = String(formData.get("email") ?? "");
  const path = `/read/${encodeURIComponent(token)}`;
  const payload = verifyReadToken(token);

  if (!payload) {
    redirect(`${path}?error=invalid`);
  }

  if (normalizeEmail(email) !== payload.email) {
    redirect(`${path}?error=email`);
  }

  const access = await loadReadableOrder(payload.orderId, payload.bookId);
  if (access !== "ok") {
    redirect(`${path}?error=access`);
  }

  const jar = await cookies();
  jar.set(
    readCookieName(payload.orderId),
    readCookieValue(payload.orderId, payload.email),
    sessionCookieOptions(),
  );
  redirect(path);
}
