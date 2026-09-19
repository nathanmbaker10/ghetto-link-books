import { Resend } from "resend";
import type { Book } from "@/data/books";
import { formatUsdFromCents } from "@/lib/pricing";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendOrderEmail({
  to,
  books,
  totalCents,
}: {
  to: string;
  books: Book[];
  totalCents: number;
}): Promise<{ error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      error:
        "RESEND_API_KEY is not set on the server. Add it in Vercel environment variables.",
    };
  }

  const from =
    process.env.EMAIL_FROM ??
    "Ghetto Link Books <orders@ghettolink22.com>";
  const replyTo =
    process.env.EMAIL_REPLY_TO ?? "ghettolink22@gmail.com";
  const titles = books.map((book) => book.title);
  const list = titles.map((title) => `<li>${escapeHtml(title)}</li>`).join("");

  const resend = new Resend(apiKey);
  const bcc =
    replyTo && replyTo.toLowerCase() !== to.toLowerCase() ? [replyTo] : undefined;
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo,
    bcc,
    subject: "Your Ghetto Link Books order",
    html: `
      <p>Thanks for buying from Ghetto Link Books.</p>
      <p>We received payment for:</p>
      <ul>${list}</ul>
      <p>Total: ${formatUsdFromCents(totalCents)}</p>
      <p>Digital files will be emailed after this confirmation. Reply to this message if you need help.</p>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    return { error: error.message };
  }

  return {};
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
