import { CATEGORIES } from "@/lib/constants";

type StatsProps = {
  listingCount: number | null;
};

/** The three-number strip under the hero, filled with real numbers. */
export default function Stats({ listingCount }: StatsProps) {
  const stats = [
    { value: listingCount === null ? "—" : listingCount.toLocaleString("en-PH"), label: "ITEMS LISTED" },
    { value: String(CATEGORIES.length), label: "CATEGORIES" },
    { value: "₱0", label: "LISTING FEES" },
  ];

  return (
    <section className="stats" aria-label="Marketplace at a glance">
      <dl className="stats__list">
        {stats.map((stat) => (
          <div key={stat.label} className="stats__item">
            <dt className="stats__label">{stat.label}</dt>
            <dd className="stats__value">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
