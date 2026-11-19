import Link from "next/link";
import ListingCard from "./ListingCard";
import type { Listing } from "@/lib/listings";

type ListingGridProps = {
  listings: Listing[];
  filtered: boolean;
};

/** The product grid, or an empty state when there is nothing to show. */
export default function ListingGrid({ listings, filtered }: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="state">
        <p className="state__title">{filtered ? "No listings match your search." : "No listings yet."}</p>
        <p>{filtered ? "Try another keyword or category." : "Be the first to sell something."}</p>
        <Link href={filtered ? "/#listings" : "/listings/new"} className="button" scroll={false}>
          {filtered ? "Clear filters" : "Sell an item"}
        </Link>
      </div>
    );
  }

  const now = Date.now();
  return (
    <ul className="grid" aria-label={`${listings.length} listings`}>
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} now={now} />
      ))}
    </ul>
  );
}
