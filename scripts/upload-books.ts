import { put } from "@vercel/blob";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set.");
  }

  const folder = join(process.cwd(), "private", "books");
  const files = (await readdir(folder)).filter((name) => name.endsWith(".pdf"));
  const uploaded: string[] = [];

  for (const name of files) {
    const body = await readFile(join(folder, name));
    const pathname = `books/${name}`;
    await put(pathname, body, {
      access: "private",
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/pdf",
      multipart: true,
    });
    uploaded.push(`${pathname}:${body.length}`);
    console.log(`uploaded ${pathname} ${body.length}`);
  }

  console.log(`done ${uploaded.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
