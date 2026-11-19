/** Shown while a page is loading: grey placeholder cards in the grid layout. */
export default function Loading() {
  return (
    <section className="section" aria-busy="true">
      <p className="visually-hidden" role="status">
        Loading listings…
      </p>
      <div className="skeleton skeleton--title" />
      <ul className="grid" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="card">
            <div className="skeleton skeleton--media" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line skeleton--short" />
          </li>
        ))}
      </ul>
    </section>
  );
}
