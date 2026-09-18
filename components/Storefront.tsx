"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { Book } from "@/data/books";
import {
  BOOK_PRICE_CENTS,
  formatUsdFromCents,
  freeBookCount,
  totalCents,
} from "@/lib/pricing";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Storefront({ books }: { books: Book[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedBooks = useMemo(
    () => books.filter((book) => selectedIds.includes(book.id)),
    [books, selectedIds],
  );

  const count = selectedBooks.length;
  const free = freeBookCount(count);
  const total = totalCents(count);

  function toggleBook(id: string) {
    setError(null);
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((bookId) => bookId !== id)
        : [...current, id],
    );
  }

  async function onCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (count === 0) {
      setError("Select at least one book.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!emailPattern.test(trimmedEmail)) {
      setError("Enter a valid email so we can send your files.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookIds: selectedIds,
          email: trimmedEmail,
        }),
      });
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !payload.url) {
        setError(payload.error ?? "Could not start checkout. Try again.");
        return;
      }

      window.location.assign(payload.url);
    } catch {
      setError("Could not start checkout. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex shrink-0 items-end justify-between gap-4 border-b border-ink/15 px-3 py-2.5 sm:px-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
            Independent press
          </p>
          <h1 className="font-serif text-2xl leading-none text-ink sm:text-3xl">
            Ghetto Link Books
          </h1>
        </div>
        <p className="shrink-0 text-right text-xs leading-5 text-ink/70 sm:text-sm">
          {formatUsdFromCents(BOOK_PRICE_CENTS)} each.
          <br />
          Buy two, get one free.
        </p>
      </header>

      <section className="min-h-0 flex-1 px-2 py-2 sm:px-4 sm:py-3">
        <h2 className="sr-only">Choose your books</h2>
        <ul className="grid h-full grid-cols-7 gap-1.5 sm:gap-2 lg:gap-3">
          {books.map((book) => {
            const selected = selectedIds.includes(book.id);
            return (
              <li key={book.id} className="min-h-0">
                <button
                  type="button"
                  onClick={() => toggleBook(book.id)}
                  aria-pressed={selected}
                  className={`flex h-full min-h-0 w-full flex-col text-left outline-none transition ${
                    selected ? "ring-2 ring-gold ring-offset-2 ring-offset-paper" : ""
                  }`}
                >
                  <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-ink/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="max-h-full max-w-full object-contain"
                    />
                    {selected ? (
                      <span className="absolute right-1.5 top-1.5 bg-gold px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink">
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-1 min-h-[2.8em] shrink-0 text-center font-serif text-[10px] leading-tight text-ink sm:min-h-[3em] sm:text-xs lg:text-sm">
                    {book.title}
                  </h3>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <form
        onSubmit={onCheckout}
        className="shrink-0 border-t border-ink/15 bg-paper px-3 py-2.5 sm:px-6"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="font-serif text-base text-ink sm:text-lg">
              {count === 0
                ? "No books selected"
                : `${count} book${count === 1 ? "" : "s"} · ${formatUsdFromCents(total)}`}
            </p>
            <p className="truncate text-xs text-ink/70">
              {free > 0
                ? `${free} free with buy 2 get 1 free.`
                : "Third book is free."}
              {selectedBooks.length > 0
                ? ` ${selectedBooks.map((book) => book.title).join(" · ")}`
                : ""}
            </p>
          </div>

          <div className="flex w-full gap-2 sm:w-auto sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-0.5 text-xs text-ink/80 sm:w-56 sm:flex-none">
              Email for your files
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="border border-ink/20 bg-white px-2.5 py-1.5 text-sm text-ink outline-none focus:border-gold"
                placeholder="you@email.com"
              />
            </label>
            <button
              type="submit"
              disabled={submitting || count === 0}
              className="shrink-0 bg-ink px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-paper disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:py-2"
            >
              {submitting ? "Starting checkout…" : "Pay with Cash App"}
            </button>
          </div>
        </div>
        {error ? (
          <p className="mt-2 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
