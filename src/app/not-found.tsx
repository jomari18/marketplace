import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="state">
        <p className="state__title">We couldn&apos;t find that listing.</p>
        <p>It may have been removed, or the link is wrong.</p>
        <Link href="/#listings" className="button">
          Browse listings
        </Link>
      </div>
    </section>
  );
}
