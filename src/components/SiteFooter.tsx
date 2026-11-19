import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

/** Footer in the design's style: big wordmark, tagline, link columns. */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__brand">
        <p className="site-footer__wordmark">Marketplace</p>
        <p className="muted">Buy and sell preloved items in your community. No account needed.</p>
      </div>

      <div className="site-footer__columns">
        <nav aria-label="Categories">
          <h2 className="site-footer__heading">Categories</h2>
          <ul>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/?category=${c.slug}#listings`}>{c.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Marketplace">
          <h2 className="site-footer__heading">Marketplace</h2>
          <ul>
            <li>
              <Link href="/#listings">Browse listings</Link>
            </li>
            <li>
              <Link href="/listings/new">Sell an item</Link>
            </li>
          </ul>
        </nav>
      </div>

      <p className="site-footer__legal muted">© {new Date().getFullYear()} Marketplace · Test 3</p>
    </footer>
  );
}
