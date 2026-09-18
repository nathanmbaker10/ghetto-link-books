import { Storefront } from "@/components/Storefront";
import { books } from "@/data/books";

export default function Home() {
  return <Storefront books={books} />;
}
