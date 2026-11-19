import Image from "next/image";
import Link from "next/link";
import { categoryLabel } from "@/lib/constants";
import { formatListedAgo, formatPrice, isNew } from "@/lib/format";
import type { Listing } from "@/lib/listings";

type ListingCardProps = {
  listing: Listing;
  now: number;
};

/** A product card from the design: photo, category, title, price, age. */
export default function ListingCard({ listing, now }: ListingCardProps) {
  return (
    <li className="card">
      <Link href={`/listings/${listing.id}`} className="card__link">
        <div className="card__media">
          <Image
            src={listing.image_url}
            alt=""
            fill
            sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, (max-width: 1200px) 33vw, 302px"
            className="card__image"
          />
          {isNew(listing.created_at, now) && <span className="tag card__tag">NEW</span>}
        </div>
        <div className="card__info">
          <p className="card__category">{categoryLabel(listing.category)}</p>
          <h3 className="card__title">{listing.title}</h3>
          <p className="card__price">{formatPrice(Number(listing.price))}</p>
          <p className="card__meta">{formatListedAgo(listing.created_at, now)}</p>
        </div>
      </Link>
    </li>
  );
}
