import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Send, Loader2 } from "lucide-react";

export default function ContactPage() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Submission failed"
        );
      }

      setSubmitted(true);
      toast.success("Message sent! We'll get back to you soon.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

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
      <main className="mx-auto max-w-2xl px-6 py-16">
        {submitted ? (
          <Card className="border border-border bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-xl">Message Received</CardTitle>
              <CardDescription>
                Thank you for reaching out. We'll review your message and
                respond to{" "}
                <span className="font-medium text-foreground">{email}</span> as
                soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => setLocation("/")}>
                Return to Home
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-10">
              <h1
                className="mb-3 text-3xl font-bold tracking-tight"
                style={{ fontFamily: '"Cinzel Decorative", serif' }}
              >
                Contact Us
              </h1>
              <p className="text-muted-foreground leading-7">
                Have a question, run into an issue, or want to share feedback?
                Fill out the form below and we'll get back to you shortly.
              </p>
            </div>

            <Card className="border border-border bg-card text-card-foreground">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-name">Your Name</Label>
                    <Input
                      id="contact-name"
                      type="text"
                      placeholder="Jane Smith"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      disabled={submitting}
                      maxLength={200}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-email">Email Address</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="jane@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-message">
                      Describe Your Issue or Message
                    </Label>
                    <textarea
                      id="contact-message"
                      rows={6}
                      placeholder="Please describe your issue or question in as much detail as possible…"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      disabled={submitting}
                      required
                      maxLength={5000}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="gap-2 w-full sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
