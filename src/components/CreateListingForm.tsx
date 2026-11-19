"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PhotoField from "./PhotoField";
import { CATEGORIES, LIMITS } from "@/lib/constants";
import { createListing, validateListing, type FieldErrors, type ListingInput } from "@/lib/create-listing";

const EMPTY: ListingInput = {
  title: "",
  description: "",
  price: "",
  category: "",
  sellerEmail: "",
  photo: null,
};

/** The "Sell an item" form. */
export default function CreateListingForm() {
  const router = useRouter();
  const [values, setValues] = useState<ListingInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function update<K extends keyof ListingInput>(key: K, value: ListingInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined })); // clear that field's error as they fix it
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const problems = validateListing(values);
    setErrors(problems);
    if (Object.keys(problems).length > 0) {
      // After the errors render, move focus to the first invalid field on screen.
      const form = event.currentTarget as HTMLFormElement;
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    setSubmitting(true);
    try {
      const id = await createListing(values);
      router.push(`/listings/${id}?created=1`);
    } catch (err) {
      console.error("Could not create listing", err);
      setFormError("Sorry, your listing couldn't be published. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  const describe = (field: keyof ListingInput, hint?: string) =>
    [errors[field] ? `${field}-error` : null, hint].filter(Boolean).join(" ") || undefined;

  return (
    <form className="form form--two-col" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
      <PhotoField
        photo={values.photo}
        error={errors.photo}
        disabled={submitting}
        onChange={(file) => update("photo", file)}
      />

      <div className="form__fields">
        <div className="field">
          <label htmlFor="title" className="field__label">
            Title
          </label>
          <input
            id="title"
            className="input"
            value={values.title}
            onChange={(e) => update("title", e.target.value)}
            maxLength={LIMITS.titleMax}
            placeholder="e.g. Black leather backpack"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describe("title")}
            disabled={submitting}
          />
          {errors.title && <p id="title-error" className="field__error">{errors.title}</p>}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="price" className="field__label">
              Price (₱)
            </label>
            <input
              id="price"
              className="input"
              type="number"
              inputMode="decimal"
              min={0}
              max={LIMITS.priceMax}
              step="0.01"
              value={values.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="0"
              aria-invalid={Boolean(errors.price)}
              aria-describedby={describe("price")}
              disabled={submitting}
            />
            {errors.price && <p id="price-error" className="field__error">{errors.price}</p>}
          </div>

          <div className="field">
            <label htmlFor="category" className="field__label">
              Category
            </label>
            <select
              id="category"
              className="input"
              value={values.category}
              onChange={(e) => update("category", e.target.value)}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={describe("category")}
              disabled={submitting}
            >
              <option value="" disabled>
                Choose…
              </option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors.category && <p id="category-error" className="field__error">{errors.category}</p>}
          </div>
        </div>

        <div className="field">
          <label htmlFor="description" className="field__label">
            Description
          </label>
          <textarea
            id="description"
            className="input input--textarea"
            rows={6}
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
            maxLength={LIMITS.descriptionMax}
            placeholder="Condition, size, what's included, where to meet…"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={describe("description", "description-count")}
            disabled={submitting}
          />
          <p id="description-count" className="field__hint">
            {values.description.length} / {LIMITS.descriptionMax}
          </p>
          {errors.description && (
            <p id="description-error" className="field__error">
              {errors.description}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="seller-email" className="field__label">
            Your email
          </label>
          <input
            id="seller-email"
            className="input"
            type="email"
            autoComplete="email"
            value={values.sellerEmail}
            onChange={(e) => update("sellerEmail", e.target.value)}
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.sellerEmail)}
            aria-describedby={describe("sellerEmail", "seller-email-hint")}
            disabled={submitting}
          />
          <p id="seller-email-hint" className="field__hint">
            Private. Buyers never see it; we email you when someone sends a message.
          </p>
          {errors.sellerEmail && (
            <p id="sellerEmail-error" className="field__error">
              {errors.sellerEmail}
            </p>
          )}
        </div>

        {formError && (
          <p className="notice notice--error" role="alert">
            {formError}
          </p>
        )}

        <button type="submit" className="button button--block" disabled={submitting}>
          {submitting && <span className="spinner" aria-hidden="true" />}
          {submitting ? "Publishing…" : "Publish listing"}
        </button>
      </div>
    </form>
  );
}
