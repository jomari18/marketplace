"use client";

import { useRef, useState } from "react";
import { EMAIL_PATTERN, LIMITS } from "@/lib/constants";

type MessageSellerProps = {
  listingId: string;
  listingTitle: string;
};

type Status = "closed" | "open" | "sending" | "sent";
type Errors = { name?: string; email?: string; body?: string };

/** "Message Seller" button that opens a short form. Sends to /api/messages. */
export default function MessageSeller({ listingId, listingTitle }: MessageSellerProps) {
  const [status, setStatus] = useState<Status>("closed");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState(`Hi! Is "${listingTitle}" still available?`);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  function open() {
    setStatus("open");
    // Wait for the form to render, then move focus into it.
    requestAnimationFrame(() => nameRef.current?.focus());
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!name.trim() || name.length > LIMITS.nameMax) e.name = "Enter your name.";
    if (!EMAIL_PATTERN.test(email.trim())) e.email = "Enter a valid email so the seller can reply.";
    if (!body.trim() || body.length > LIMITS.messageMax) e.body = `Write a message (up to ${LIMITS.messageMax} characters).`;
    return e;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const problems = validate();
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setStatus("sending");
    try {
      // The server route saves the message and emails the seller.
      // The seller's email address never comes to the browser.
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, buyerName: name, buyerEmail: email, body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Request failed");
      }
      setStatus("sent");
    } catch (err) {
      console.error("Could not send message", err);
      setFormError("Sorry, your message couldn't be sent. Please try again.");
      setStatus("open");
    }
  }

  if (status === "sent") {
    return (
      <div className="notice notice--success" role="status">
        <p className="notice__title">Message sent!</p>
        <p>The seller will reply to {email.trim()}.</p>
      </div>
    );
  }

  if (status === "closed") {
    return (
      <button type="button" className="button button--block button--ghost" onClick={open} aria-controls="message-form">
        Message Seller
      </button>
    );
  }

  const sending = status === "sending";
  return (
    <form id="message-form" className="message-form" onSubmit={handleSubmit} noValidate aria-busy={sending}>
      <h2 className="detail__subheading">Message the seller</h2>
      <p className="field__hint">Your name, email and message go to the seller only.</p>

      <div className="field-row">
        <div className="field">
          <label htmlFor="buyer-name" className="field__label">
            Your name
          </label>
          <input
            ref={nameRef}
            id="buyer-name"
            className="input"
            autoComplete="name"
            maxLength={LIMITS.nameMax}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "buyer-name-error" : undefined}
            disabled={sending}
          />
          {errors.name && <p id="buyer-name-error" className="field__error">{errors.name}</p>}
        </div>
        <div className="field">
          <label htmlFor="buyer-email" className="field__label">
            Your email
          </label>
          <input
            id="buyer-email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "buyer-email-error" : undefined}
            disabled={sending}
          />
          {errors.email && <p id="buyer-email-error" className="field__error">{errors.email}</p>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="message-body" className="field__label">
          Message
        </label>
        <textarea
          id="message-body"
          className="input input--textarea"
          rows={4}
          maxLength={LIMITS.messageMax}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-invalid={Boolean(errors.body)}
          aria-describedby={errors.body ? "message-body-error" : undefined}
          disabled={sending}
        />
        {errors.body && <p id="message-body-error" className="field__error">{errors.body}</p>}
      </div>

      {formError && (
        <p className="notice notice--error" role="alert">
          {formError}
        </p>
      )}

      <div className="message-form__actions">
        <button type="submit" className="button" disabled={sending}>
          {sending && <span className="spinner" aria-hidden="true" />}
          {sending ? "Sending…" : "Send message"}
        </button>
        <button type="button" className="button button--ghost" onClick={() => setStatus("closed")} disabled={sending}>
          Cancel
        </button>
      </div>
    </form>
  );
}
