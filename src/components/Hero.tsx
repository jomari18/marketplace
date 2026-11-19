import Image from "next/image";
import Link from "next/link";

/** The big photo banner from the design, with a dark gradient for readable text. */
export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <Image
        src="/images/hero.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="hero__image"
      />
      <div className="hero__content">
        <p className="hero__eyebrow">BUY &amp; SELL WITH PURPOSE</p>
        <h1 id="hero-title" className="hero__title">
          Preloved finds, new stories
        </h1>
        <p className="hero__lead">Discover secondhand pieces from people near you, or list your own in a minute.</p>
        <div className="hero__actions">
          <Link href="/#listings" className="button button--light">
            Browse listings
            <Image src="/icons/arrow-right.svg" alt="" width={24} height={24} />
          </Link>
          <Link href="/listings/new" className="button button--outline-light">
            Sell an item
          </Link>
        </div>
      </div>
    </section>
  );
}
