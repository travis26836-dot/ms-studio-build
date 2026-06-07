import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
      <main className="mx-auto max-w-3xl px-6 py-16 prose prose-invert prose-sm max-w-none">
        <h1
          className="mb-2 text-3xl font-bold tracking-tight"
          style={{ fontFamily: '"Cinzel Decorative", serif' }}
        >
          Privacy Policy
        </h1>
        <p className="text-xs text-muted-foreground mb-10">
          Last updated: April 2025
        </p>

        <div className="space-y-8 text-sm leading-7 text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">
          <section>
            <h2>1. Introduction</h2>
            <p>
              Welcome to ManuScript Studio ("Company", "we", "our", "us"). We
              are committed to protecting your personal information and your
              right to privacy. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you access or
              use our platform and services (the "Service").
            </p>
            <p>
              Please read this policy carefully. If you disagree with its terms,
              please discontinue use of the Service.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <p>
              <strong className="text-foreground">
                a. Information You Provide
              </strong>
            </p>
            <ul>
              <li>
                <strong className="text-foreground">
                  Account Information:
                </strong>{" "}
                Name, email address, and password when you register.
              </li>
              <li>
                <strong className="text-foreground">
                  Payment Information:
                </strong>{" "}
                Billing details processed securely by our third-party payment
                provider (Stripe). We do not store full card numbers.
              </li>
              <li>
                <strong className="text-foreground">
                  Support &amp; Contact Requests:
                </strong>{" "}
                Any information you provide when you submit a support request or
                contact form.
              </li>
              <li>
                <strong className="text-foreground">User Content:</strong>{" "}
                Design projects, templates, and assets you create or upload
                within the Service.
              </li>
            </ul>
            <p>
              <strong className="text-foreground">
                b. Information Collected Automatically
              </strong>
            </p>
            <ul>
              <li>
                <strong className="text-foreground">Usage Data:</strong> Pages
                visited, features used, and interactions with the Service.
              </li>
              <li>
                <strong className="text-foreground">
                  Device &amp; Log Data:
                </strong>{" "}
                IP address, browser type, operating system, and device
                identifiers.
              </li>
              <li>
                <strong className="text-foreground">
                  Cookies &amp; Tracking:
                </strong>{" "}
                We use cookies and similar technologies to maintain sessions and
                improve the Service.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <ul>
              <li>To provide, operate, and maintain the Service.</li>
              <li>To process payments and manage your subscription.</li>
              <li>
                To respond to your support requests and contact form
                submissions.
              </li>
              <li>To improve, personalize, and expand the Service.</li>
              <li>
                To send administrative communications (account updates, security
                alerts).
              </li>
              <li>
                To comply with legal obligations and enforce our agreements.
              </li>
            </ul>
          </section>

          <section>
            <h2>4. Sharing Your Information</h2>
            <p>We may share your information with:</p>
            <ul>
              <li>
                <strong className="text-foreground">Service Providers:</strong>{" "}
                Trusted third parties who assist us in operating the Service
                (e.g., hosting, payment processing, authentication, analytics).
              </li>
              <li>
                <strong className="text-foreground">Legal Authorities:</strong>{" "}
                When required by law or to protect the rights, property, or
                safety of ManuScript Studio, our users, or others.
              </li>
              <li>
                <strong className="text-foreground">Business Transfers:</strong>{" "}
                In connection with a merger, acquisition, or sale of all or a
                portion of our assets.
              </li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2>5. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is
              active or as needed to provide the Service. You may request
              deletion of your account and associated data by contacting us. We
              may retain certain information as required by law or for
              legitimate business purposes.
            </p>
          </section>

          <section>
            <h2>6. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul>
              <li>Access, correct, or delete your personal information.</li>
              <li>Object to or restrict certain processing.</li>
              <li>Request a portable copy of your data.</li>
              <li>Withdraw consent where processing is based on consent.</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us using the
              Contact page or by emailing us directly.
            </p>
          </section>

          <section>
            <h2>7. International Data Transfers</h2>
            <p>
              Your information may be transferred to and maintained on servers
              located outside your state, province, country, or other
              governmental jurisdiction where data protection laws may differ.
              We take steps to ensure your data is treated securely in
              accordance with this policy.
            </p>
          </section>

          <section>
            <h2>8. Security</h2>
            <p>
              We implement industry-standard security measures to protect your
              information, including encrypted connections (TLS) and access
              controls. However, no method of transmission over the Internet or
              electronic storage is 100% secure. We cannot guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2>9. Children's Privacy</h2>
            <p>
              Our Service is not directed to individuals under the age of 16. We
              do not knowingly collect personal information from children under
              16. If we become aware that we have inadvertently collected such
              information, we will take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h2>10. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your
              experience. You may configure your browser to refuse cookies;
              however, some features of the Service may not function properly
              without them.
            </p>
          </section>

          <section>
            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of material changes by posting the updated policy on
              this page and updating the "Last updated" date. Continued use of
              the Service after changes take effect constitutes your acceptance
              of the revised policy.
            </p>
          </section>

          <section>
            <h2>12. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy,
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
