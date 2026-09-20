"use client";

import { useEffect, useRef, useState } from "react";

type PdfDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<{
    getViewport: (params: { scale: number }) => { width: number; height: number };
    render: (params: {
      canvas: HTMLCanvasElement;
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }) => { cancel: () => void; promise: Promise<unknown> };
  }>;
  destroy?: () => Promise<void>;
};

export function PdfReader({
  token,
  title,
  watermark,
}: {
  token: string;
  title: string;
  watermark: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<PdfDocument | null>(null);
  const [docReady, setDocReady] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    docRef.current = null;
    setPage(1);
    setPageCount(0);
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const response = await fetch(`/api/read/${encodeURIComponent(token)}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (response.status === 404) {
          throw new Error("This title is not uploaded yet.");
        }
        if (!response.ok) {
          throw new Error("Could not open this story.");
        }
        const data = await response.arrayBuffer();
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const pdf = (await pdfjs.getDocument({ data })
          .promise) as unknown as PdfDocument;
        if (cancelled) {
          await pdf.destroy?.();
          return;
        }
        docRef.current = pdf;
        setPageCount(pdf.numPages);
        setDocReady((value) => value + 1);
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error ? cause.message : "Could not open this story.",
          );
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
      const current = docRef.current;
      docRef.current = null;
      void current?.destroy?.();
    };
  }, [token]);

  useEffect(() => {
    const pdf = docRef.current;
    if (!pdf || docReady === 0) {
      return;
    }
    const openedPdf = pdf;

    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | undefined;

    async function draw() {
      setLoading(true);
      setError(null);
      try {
        const current = Math.min(Math.max(page, 1), openedPdf.numPages);
        const pdfPage = await openedPdf.getPage(current);
        const canvas = canvasRef.current;
        if (!canvas || cancelled) {
          return;
        }
        const base = pdfPage.getViewport({ scale: 1 });
        const scale = Math.min(
          1.6,
          (Math.min(window.innerWidth, 900) - 48) / base.width,
        );
        const viewport = pdfPage.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Could not draw this page.");
        }
        const task = pdfPage.render({
          canvas,
          canvasContext: context,
          viewport,
        });
        renderTask = task;
        await task.promise;
      } catch (cause) {
        if (!cancelled) {
          const message =
            cause instanceof Error ? cause.message : "Could not open this story.";
          if (!message.includes("Rendering cancelled")) {
            setError(message);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void draw();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [page, docReady]);

  return (
    <main className="mx-auto flex min-h-full max-w-5xl flex-col px-4 py-8 sm:px-6">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">
        Ghetto Link Books
      </p>
      <h1 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-ink/70">
        Read on this page. There is no file to forward.
      </p>
      {error ? (
        <p className="mt-6 text-base text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      <div
        className="relative mt-6 overflow-hidden bg-ink/5"
        onContextMenu={(event) => event.preventDefault()}
      >
        {loading && pageCount === 0 ? (
          <p className="px-4 py-16 text-center text-sm text-ink/60">Loading…</p>
        ) : null}
        <canvas
          ref={canvasRef}
          className={`mx-auto max-w-full ${error || (loading && pageCount === 0) ? "hidden" : "block"}`}
        />
        {!error ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
          >
            <p className="rotate-[-28deg] text-center text-2xl font-serif text-ink/15 sm:text-4xl">
              {watermark}
            </p>
          </div>
        ) : null}
      </div>
      {pageCount > 0 && !error ? (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wider text-paper disabled:opacity-40"
          >
            Previous
          </button>
          <p className="text-sm text-ink/80">
            {page} / {pageCount}
          </p>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            className="bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wider text-paper disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </main>
  );
}
