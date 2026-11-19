import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import MessageSeller from "@/components/MessageSeller";
import { categoryLabel } from "@/lib/constants";
import { formatListedAgo, formatPrice } from "@/lib/format";
import { fetchListing } from "@/lib/listings";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchListing(id).catch(() => null);
  return { title: listing?.title ?? "Listing not found" };
}

export default async function ListingPage({ params, searchParams }: Props) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const listing = await fetchListing(id); // only public columns: no seller email
  if (!listing) notFound();

  return (
    <article className="section detail" aria-labelledby="listing-title">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link href="/">Home</Link> <span aria-hidden="true">/</span>{" "}
        <Link href={`/?category=${listing.category}#listings`}>{categoryLabel(listing.category)}</Link>{" "}
        <span aria-hidden="true">/</span> <span aria-current="page">{listing.title}</span>
      </nav>

      {created && (
        <p className="notice notice--success" role="status">
          Your listing is live! Share this page with buyers.
        </p>
      )}

      <div className="detail__layout">
        <div className="detail__media">
          <Image
            src={listing.image_url}
            alt={listing.title}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 640px"
            className="detail__image"
          />
        </div>

        <div className="detail__info">
          <p className="card__category">{categoryLabel(listing.category)}</p>
          <h1 id="listing-title" className="detail__title">
            {listing.title}
          </h1>
          <p className="detail__price">{formatPrice(Number(listing.price))}</p>
          <p className="card__meta">
            <time dateTime={listing.created_at}>{formatListedAgo(listing.created_at)}</time>
          </p>

          <div className="detail__section">
            <h2 className="detail__subheading">Description</h2>
            <p className="detail__description">{listing.description}</p>
          </div>

          <MessageSeller listingId={listing.id} listingTitle={listing.title} />
        </div>
      </div>
    </article>
  );
}
