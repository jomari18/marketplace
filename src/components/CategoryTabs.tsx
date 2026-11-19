import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

type CategoryTabsProps = {
  active: string | undefined;
  search: string;
};

/** Build a home-page link that keeps the current search text. */
function hrefFor(category: string | undefined, search: string) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (search) params.set("q", search);
  const query = params.toString();
  return `/${query ? `?${query}` : ""}#listings`;
}

/** Category filter tabs. They are plain links, so filters are shareable URLs. */
export default function CategoryTabs({ active, search }: CategoryTabsProps) {
  const tabs = [{ slug: undefined, label: "All" }, ...CATEGORIES];

  return (
    <nav aria-label="Filter by category" className="tabs">
      <ul className="tabs__list">
        {tabs.map((tab) => {
          const isActive = tab.slug === active;
          return (
            <li key={tab.label}>
              <Link
                href={hrefFor(tab.slug, search)}
                className={`tabs__tab${isActive ? " is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                scroll={false}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
