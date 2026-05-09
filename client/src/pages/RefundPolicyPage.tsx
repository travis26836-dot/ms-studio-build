import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function RefundPolicyPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <p
            className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground"
            style={{ fontFamily: '"Cinzel Decorative", serif' }}
          >
            ManuScript Studio
          </p>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1
          className="mb-2 text-3xl font-bold tracking-tight"
          style={{ fontFamily: '"Cinzel Decorative", serif' }}
        >
          Refund &amp; Return Policy
        </h1>
        <p className="text-xs text-muted-foreground mb-10">
          Last updated: April 2025
        </p>

        <div className="space-y-8 text-sm leading-7 text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">
          <p>
            Thank you for choosing ManuScript Studio. We are committed to your
            satisfaction. Because our Service delivers digital content and
            software tools, our refund policy reflects the nature of digital
            subscriptions and one-time purchases.
          </p>

          <section>
            <h2>1. Free Trial</h2>
            <p>
              Where available, ManuScript Studio offers a free trial period for
              new users. We encourage you to fully evaluate the Service during
              this period before committing to a paid plan.
            </p>
          </section>

          <section>
            <h2>2. Subscription Refunds</h2>
            <p>
              <strong className="text-foreground">Monthly Subscriptions</strong>
            </p>
            <p>
              Monthly subscriptions may be cancelled at any time. However,
              payments already processed are non-refundable. Your access will
              continue until the end of the current billing period, after which
              you will not be charged.
            </p>
            <p>
              <strong className="text-foreground">Annual Subscriptions</strong>
            </p>
            <p>
              If you cancel an annual subscription within{" "}
              <strong className="text-foreground">14 days</strong> of the
              initial purchase, you may request a full refund. After 14 days, no
              refunds will be issued for annual plans, and your access will
              remain active through the end of the paid period.
            </p>
          </section>

          <section>
            <h2>3. Exceptional Circumstances</h2>
            <p>
              Refunds may be considered on a case-by-case basis in the following
              situations:
            </p>
            <ul>
              <li>
                Significant service outages or technical failures caused by
                ManuScript Studio that substantially impair access to core
                features for an extended period.
              </li>
              <li>Duplicate charges resulting from a billing error.</li>
              <li>Unauthorized charges confirmed by our support team.</li>
            </ul>
            <p>
              To be considered, refund requests must be submitted with
              supporting details including your account email, a description of
              the issue, and any relevant documentation.
            </p>
          </section>

          <section>
            <h2>4. Non-Refundable Items</h2>
            <ul>
              <li>Fees for one-time services, custom work, or add-ons.</li>
              <li>
                Subscription periods that have already been used or have passed.
              </li>
              <li>
                Requests made after the eligible refund window has expired.
              </li>
              <li>
                Accounts terminated for violations of our Terms of Service.
              </li>
            </ul>
          </section>

          <section>
            <h2>5. How to Request a Refund</h2>
            <p>
              To request a refund, please{" "}
              <button
                onClick={() => setLocation("/contact")}
                className="underline text-foreground hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0"
              >
                contact us
              </button>{" "}
              within the applicable refund window. Include the following in your
              message:
            </p>
            <ul>
              <li>Your account email address.</li>
              <li>The date of purchase or subscription start.</li>
              <li>A description of the reason for your refund request.</li>
            </ul>
            <p>
              We will review your request and respond within{" "}
              <strong className="text-foreground">5 business days</strong>.
              Approved refunds will be processed to your original payment method
              within 5–10 business days, depending on your bank or card
              provider.
            </p>
          </section>

          <section>
            <h2>6. Service Downtime Credits</h2>
            <p>
              If a verified service outage prevents access to core features for
              more than 24 consecutive hours, affected users may be eligible for
              service credits applied to their next billing cycle. Please
              contact us with details of the outage to initiate a credit review.
            </p>
          </section>

          <section>
            <h2>7. Changes to This Policy</h2>
            <p>
              ManuScript Studio reserves the right to update or modify this
              policy at any time. Changes will be posted on this page with an
              updated effective date. Continued use of the Service after changes
              are posted constitutes your acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2>8. Contact Us</h2>
            <p>
              For questions about this policy or to initiate a refund request,
              please{" "}
              <button
                onClick={() => setLocation("/contact")}
                className="underline text-foreground hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0"
              >
                contact us
              </button>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
