import Link from "next/link";
import CategoryTabs from "@/components/CategoryTabs";
import Hero from "@/components/Hero";
import ListingGrid from "@/components/ListingGrid";
import SearchBar from "@/components/SearchBar";
import Stats from "@/components/Stats";
import { categoryLabel, isCategory } from "@/lib/constants";
import { cleanSearch, countListings, fetchListings, type Listing } from "@/lib/listings";

// Always render on request so new listings show up immediately.
export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const category = isCategory(params.category) ? params.category : undefined;
  const search = cleanSearch(params.q);

  // Load the listings and the total count in parallel.
  // Errors are caught so the page still renders with a friendly message.
  let listings: Listing[] = [];
  let total: number | null = null;
  let loadError = false;
  try {
    [listings, total] = await Promise.all([fetchListings({ category, search }), countListings()]);
  } catch (err) {
    console.error("Could not load listings", err);
    loadError = true;
  }

  const heading = search
    ? `Results for “${search}”`
    : category
      ? categoryLabel(category)
      : "Latest Listings";

  return (
    <>
      <Hero />
      <Stats listingCount={total} />

      <section id="listings" className="section" aria-labelledby="listings-heading">
        <div className="section__header">
          <h2 id="listings-heading" className="section__title">
            {heading}
          </h2>
          {(search || category) && (
            <Link href="/#listings" className="section__link" scroll={false}>
              Clear filters
            </Link>
          )}
        </div>

        <SearchBar search={search} category={category} />
        <CategoryTabs active={category} search={search} />

        {loadError ? (
          <div className="state state--error" role="alert">
            <p className="state__title">We couldn&apos;t load the listings.</p>
            <p>Please refresh the page or try again in a moment.</p>
          </div>
        ) : (
          <ListingGrid listings={listings} filtered={Boolean(search || category)} />
        )}
      </section>
    </>
  );
}
