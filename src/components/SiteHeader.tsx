import Image from "next/image";
import Link from "next/link";

/** Top bar from the design: wordmark, links, and a search icon. */
export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="wordmark">
        marketplace
      </Link>

      <nav aria-label="Main" className="site-nav">
        <Link href="/#listings">Browse</Link>
        <Link href="/listings/new" className="site-nav__chip">
          SELL AN ITEM
        </Link>
      </nav>

      <Link href="/#search" className="icon-link" aria-label="Search listings">
        <Image src="/icons/search.svg" alt="" width={24} height={24} />
      </Link>
    </header>
  );
}
