import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
            Veronica AI Studio
          </p>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1
          className="mb-2 text-3xl font-bold tracking-tight"
          style={{ fontFamily: '"Cinzel Decorative", serif' }}
        >
          Terms of Service
        </h1>
        <p className="text-xs text-muted-foreground mb-10">
          Effective Date: April 2025
        </p>

        <div className="space-y-8 text-sm leading-7 text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">
          <p>
            These Terms of Service ("Terms") govern your access to and use of
            Veronica AI Studio (the "Service") provided by Veronica AI Studio
            ("Company", "we", "us", or "our"). By accessing or using the
            Service, you agree to be bound by these Terms. If you do not agree,
            please do not use the Service.
          </p>

          <section>
            <h2>1. Eligibility</h2>
            <p>
              You must be at least 18 years old and have the legal capacity to
              enter into a binding contract to use the Service. By using the
              Service, you represent and warrant that you meet these
              requirements.
            </p>
          </section>

          <section>
            <h2>2. Account Registration</h2>
            <p>
              You may be required to register for an account to access certain
              features. You agree to provide accurate, current, and complete
              information during registration and to keep your account
              information updated. You are responsible for maintaining the
              confidentiality of your credentials and for all activity that
              occurs under your account.
            </p>
          </section>

          <section>
            <h2>3. Acceptable Use</h2>
            <p>
              You agree to use the Service only for lawful purposes. You may
              not:
            </p>
            <ul>
              <li>Use the Service for any illegal or unauthorized purpose.</li>
              <li>
                Violate any applicable laws, regulations, or third-party rights.
              </li>
              <li>
                Upload, post, or transmit harmful, abusive, defamatory, or
                otherwise objectionable content.
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Service.
              </li>
              <li>
                Attempt to gain unauthorized access to any part of the Service
                or its related systems.
              </li>
              <li>
                Reverse-engineer, decompile, or disassemble any portion of the
                Service.
              </li>
            </ul>
          </section>

          <section>
            <h2>4. Subscription and Payment</h2>
            <p>
              Certain features of the Service require a paid subscription.
              Subscription plans, pricing, and billing cycles are described on
              our pricing page. All fees are charged in advance and are
              non-refundable except as set forth in our{" "}
              <button
                onClick={() => setLocation("/refund-policy")}
                className="underline text-foreground hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0"
              >
                Refund Policy
              </button>
              . We reserve the right to change pricing with reasonable notice.
            </p>
          </section>

          <section>
            <h2>5. Intellectual Property</h2>
            <p>
              All content, features, and functionality of the Service —
              including but not limited to software, text, graphics, logos, and
              trademarks — are owned by Veronica AI Studio or its licensors and
              are protected by applicable intellectual property laws.
            </p>
            <p>
              You retain ownership of the original content you create using the
              Service. By using the Service, you grant us a limited,
              non-exclusive, royalty-free license to host and process your
              content solely as necessary to provide the Service.
            </p>
          </section>

          <section>
            <h2>6. User Content</h2>
            <p>
              You are solely responsible for the content you create, upload, or
              share through the Service. You represent and warrant that you have
              all necessary rights to such content and that it does not infringe
              any third-party intellectual property or other rights.
            </p>
          </section>

          <section>
            <h2>7. AI-Generated and Stock Assets</h2>
            <p>
              AI-generated outputs may not be unique and similar outputs may be
              generated for other users. You are responsible for reviewing AI
              outputs before publishing, selling, trademarking, or otherwise
              using them commercially.
            </p>
            <p>
              Stock assets remain subject to the license terms shown for their
              source. We may store source, license, attribution, and
              commercial-use metadata with stock asset records, but you are
              responsible for confirming that your final use complies with the
              applicable third-party license and does not infringe rights of
              identifiable people, brands, or property.
            </p>
          </section>

          <section>
            <h2>8. Privacy</h2>
            <p>
              Your use of the Service is also governed by our{" "}
              <button
                onClick={() => setLocation("/privacy-policy")}
                className="underline text-foreground hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0"
              >
                Privacy Policy
              </button>
              , which is incorporated into these Terms by reference.
            </p>
          </section>

          <section>
            <h2>9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account or
              access to the Service at our sole discretion, with or without
              notice, for conduct that violates these Terms or is harmful to
              other users, us, or third parties. Upon termination, your right to
              use the Service will immediately cease.
            </p>
          </section>

          <section>
            <h2>10. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" and "as available" without
              warranties of any kind, whether express or implied, including but
              not limited to implied warranties of merchantability, fitness for
              a particular purpose, or non-infringement. We do not warrant that
              the Service will be uninterrupted, error-free, or free of viruses
              or other harmful components.
            </p>
          </section>

          <section>
            <h2>11. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, Veronica AI
              Studio and its affiliates, officers, directors, employees, and
              agents shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages arising out of or related to
              your use of or inability to use the Service, even if we have been
              advised of the possibility of such damages. Our total liability to
              you for any claim arising out of these Terms shall not exceed the
              amount you paid to us in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2>12. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Veronica AI
              Studio and its affiliates from and against any claims,
              liabilities, damages, judgments, awards, losses, costs, or
              expenses (including reasonable attorneys' fees) arising out of
              your use of the Service, your violation of these Terms, or your
              violation of any third-party rights.
            </p>
          </section>

          <section>
            <h2>13. Modifications to the Service</h2>
            <p>
              We reserve the right to modify, suspend, or discontinue any part
              of the Service at any time without notice or liability. We may
              also update these Terms periodically. Continued use of the Service
              after changes are posted constitutes your acceptance of the
              revised Terms.
            </p>
          </section>

          <section>
            <h2>14. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the United States, without
              regard to conflict of law principles. Any disputes arising from
              these Terms or your use of the Service shall be resolved
              exclusively in the courts of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2>15. Contact</h2>
            <p>
              For questions about these Terms, please{" "}
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
