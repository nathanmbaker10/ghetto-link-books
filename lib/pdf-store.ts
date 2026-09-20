import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";

export type PdfLookup = { buffer: Buffer } | { missing: true };

export async function getBookPdf(bookId: string): Promise<PdfLookup> {
  if (!/^[a-z0-9-]+$/.test(bookId)) {
    return { missing: true };
  }

  const localPath = join(process.cwd(), "private", "books", `${bookId}.pdf`);
  if (existsSync(localPath)) {
    return { buffer: await readFile(localPath) };
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { missing: true };
  }

  try {
    const { get } = await import("@vercel/blob");
    const result = await get(`books/${bookId}.pdf`, {
      access: "private",
      useCache: false,
    });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return { missing: true };
    }
    const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());
    if (buffer.length === 0) {
      return { missing: true };
    }
    return { buffer };
  } catch (error) {
    console.error(error);
    return { missing: true };
  }
}
