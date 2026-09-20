"use client";

import { unlockReader } from "@/app/read/unlock-action";

export function EmailGate({
  token,
  error,
}: {
  token: string;
  error?: string;
}) {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-20">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">
        Ghetto Link Books
      </p>
      <h1 className="mt-4 font-serif text-4xl text-ink">Open your story</h1>
      <p className="mt-4 text-base leading-7 text-ink/80">
        Enter the email you used at checkout. This keeps the link from working
        for anyone else.
      </p>
      {error ? (
        <p className="mt-4 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      <form action={unlockReader} className="mt-8 flex flex-col gap-3">
        <input type="hidden" name="token" value={token} />
        <label className="flex flex-col gap-1 text-sm text-ink">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            className="border border-ink/20 bg-white px-3 py-2 text-base outline-none focus:border-gold"
            placeholder="you@email.com"
          />
        </label>
        <button
          type="submit"
          className="bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper"
        >
          Continue
        </button>
      </form>
    </main>
  );
}
