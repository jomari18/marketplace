import type { Metadata } from "next";
import Link from "next/link";
import ConnectForm from "@/components/ConnectForm";
import { PLATFORM_FEE_PERCENT } from "@/lib/stripe";

export const metadata: Metadata = { title: "Connect with Stripe" };

type Props = { searchParams: Promise<{ error?: string }> };

export default async function ConnectPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <section className="section section--narrow" aria-labelledby="connect-heading">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link href="/">Home</Link> <span aria-hidden="true">/</span> <span>Get paid</span>
      </nav>

      <div className="connect">
        <div className="page-intro">
          <p className="eyebrow">GET PAID WITH STRIPE</p>
          <h1 id="connect-heading" className="page-title">
            Connect with Stripe
          </h1>
          <p className="muted">
            Let buyers pay for your items online. Stripe handles the payment and sends the money to your account.
          </p>
        </div>

        <ol className="steps">
          <li>
            <strong>Enter your seller email</strong>
            <span className="muted">The one you used when listing your items.</span>
          </li>
          <li>
            <strong>Finish Stripe&apos;s onboarding</strong>
            <span className="muted">A secure Stripe page. In test mode you can use Stripe&apos;s test data.</span>
          </li>
          <li>
            <strong>Start selling</strong>
            <span className="muted">
              Your listings get a Buy Now button. Marketplace keeps a {PLATFORM_FEE_PERCENT}% fee per sale.
            </span>
          </li>
        </ol>

        {error && (
          <p className="notice notice--error" role="alert">
            That onboarding link expired. Enter your email again to get a new one.
          </p>
        )}

        <ConnectForm />
      </div>
    </section>
  );
}
