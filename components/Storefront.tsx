"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { Book } from "@/data/books";
import {
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
      <header className="shrink-0 border-b border-ink/15 px-3 py-2.5 sm:px-6">
        <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
          Independent press
        </p>
        <h1 className="font-serif text-2xl leading-none text-ink sm:text-3xl">
          Ghetto Link Books
        </h1>
        <h2 className="mt-3 text-center font-serif text-3xl leading-tight text-ink sm:text-4xl">
          Select the books you want
        </h2>
        <p className="mt-1 text-center text-xl text-ink/80 sm:text-2xl">
          $10 each buy 2 get one free.
        </p>
      </header>

      <section className="min-h-0 flex-1 px-2 py-2 sm:px-4 sm:py-3">
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
        className="shrink-0 border-t border-ink/15 bg-paper px-3 py-3 sm:px-6"
      >
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

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <label className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <span className="flex items-center gap-2 font-serif text-2xl text-ink sm:text-3xl">
              Enter your email
              <span aria-hidden="true" className="text-gold">
                →
              </span>
            </span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full max-w-md border border-ink/20 bg-white px-3 py-2 text-base text-ink outline-none focus:border-gold sm:w-80"
              placeholder="you@email.com"
            />
          </label>
          <button
            type="submit"
            disabled={submitting || count === 0}
            className="shrink-0 bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-wider text-paper disabled:cursor-not-allowed disabled:opacity-40 sm:px-6 sm:py-2.5"
          >
            {submitting ? "Starting checkout…" : "Proceed to Payment"}
          </button>
        </div>
        {error ? (
          <p className="mt-2 text-center text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
