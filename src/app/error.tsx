"use client";

/** Friendly fallback if a page crashes while rendering. */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="section">
      <div className="state state--error" role="alert">
        <p className="state__title">Something went wrong.</p>
        <p>Please try again. If it keeps happening, come back in a few minutes.</p>
        <button type="button" className="button" onClick={reset}>
          Try again
        </button>
      </div>
    </section>
  );
}
