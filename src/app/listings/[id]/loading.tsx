/** Placeholder while a listing loads. */
export default function LoadingListing() {
  return (
    <section className="section detail" aria-busy="true">
      <p className="visually-hidden" role="status">
        Loading listing…
      </p>
      <div className="detail__layout" aria-hidden="true">
        <div className="skeleton detail__media" />
        <div className="detail__info">
          <div className="skeleton skeleton--line skeleton--short" />
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--block" />
        </div>
      </div>
    </section>
  );
}
