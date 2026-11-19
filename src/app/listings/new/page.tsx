import type { Metadata } from "next";
import Link from "next/link";
import CreateListingForm from "@/components/CreateListingForm";

export const metadata: Metadata = { title: "Sell an item" };

export default function NewListingPage() {
  return (
    <section className="section section--narrow" aria-labelledby="new-heading">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link href="/">Home</Link> <span aria-hidden="true">/</span> <span>Sell an item</span>
      </nav>
      <div className="page-intro">
        <p className="eyebrow">SELL WITH PURPOSE</p>
        <h1 id="new-heading" className="page-title">
          Sell an item
        </h1>
        <p className="muted">Add a photo and a few details. Your listing goes live right away, no account needed.</p>
      </div>
      <CreateListingForm />
    </section>
  );
}
