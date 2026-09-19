import Link from "next/link";
import { fulfillPaidOrder } from "@/lib/fulfill";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  const result = orderId
    ? await fulfillPaidOrder(orderId)
    : { status: "missing" as const };

  const message = messageFor(
    result.status,
    result.status === "email_failed" ? result.error : undefined,
  );

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col justify-center px-6 py-20">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">
        Ghetto Link Books
      </p>
      <h1 className="mt-4 font-serif text-5xl text-ink">Thank you</h1>
      <p className="mt-6 text-lg leading-8 text-ink/80">{message}</p>
      <Link
        href="/"
        className="mt-10 w-fit bg-ink px-6 py-3 text-sm font-semibold uppercase tracking-wider text-paper"
      >
        Back to the catalog
      </Link>
    </main>
  );
}

function messageFor(
  status: "sent" | "already" | "unpaid" | "missing" | "email_failed",
  error?: string,
): string {
  switch (status) {
    case "sent":
      return "Payment is in. Check the inbox you used at checkout for a confirmation email.";
    case "already":
      return "This order already has a confirmation email. Check your inbox and spam folder.";
    case "unpaid":
      return "We have not seen a completed Square payment yet. Finish checkout, then refresh this page.";
    case "email_failed":
      return error
        ? `Payment looks good, but the email did not send: ${error}`
        : "Payment looks good, but the confirmation email did not send.";
    case "missing":
      return "If you just paid, refresh after Square sends you back from checkout. If this page opened on its own, go back to the catalog.";
  }
}
