import { cookies } from "next/headers";
import Link from "next/link";
import { EmailGate } from "@/components/EmailGate";
import { PdfReader } from "@/components/PdfReader";
import { getBookById } from "@/data/books";
import { loadReadableOrder } from "@/lib/order-access";
import {
  readCookieName,
  readCookieValue,
  verifyReadToken,
} from "@/lib/read-token";

export const dynamic = "force-dynamic";

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const payload = verifyReadToken(token);

  if (!payload) {
    return (
      <ReadMessage
        title="Link not valid"
        body="This read link is not valid. Use the link from your order email."
      />
    );
  }

  const book = getBookById(payload.bookId);
  const access = await loadReadableOrder(payload.orderId, payload.bookId);
  if (!book || access !== "ok") {
    return (
      <ReadMessage
        title="Link not available"
        body="We could not match this link to a paid order. Use the latest email we sent you."
      />
    );
  }

  const jar = await cookies();
  const cookie = jar.get(readCookieName(payload.orderId));
  const unlocked =
    cookie?.value === readCookieValue(payload.orderId, payload.email);

  if (!unlocked) {
    return (
      <EmailGate
        token={token}
        error={gateError(error)}
      />
    );
  }

  return (
    <PdfReader
      token={token}
      title={book.title}
      watermark={payload.email}
    />
  );
}

function gateError(code?: string): string | undefined {
  switch (code) {
    case "email":
      return "That email does not match this order.";
    case "access":
      return "We could not confirm this paid order.";
    case "invalid":
      return "This read link is not valid.";
    default:
      return undefined;
  }
}

function ReadMessage({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-20">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">
        Ghetto Link Books
      </p>
      <h1 className="mt-4 font-serif text-4xl text-ink">{title}</h1>
      <p className="mt-4 text-base leading-7 text-ink/80">{body}</p>
      <Link
        href="/"
        className="mt-8 w-fit bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper"
      >
        Back to the catalog
      </Link>
    </main>
  );
}
