import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Users, Briefcase, LayoutDashboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { FusionStackLogo } from "@/components/FusionStackLogo";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: Landing });

function QuoteModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", business: "", need: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        {submitted ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-xl font-semibold">We'll be in touch!</h2>
            <p className="mt-2 text-sm text-muted-foreground">Thanks {form.name}, check your inbox for a confirmation.</p>
            <Button className="mt-6" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold">Get a free quote</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tell us about your project and we'll get back to you within 24 hours.</p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="business">Business name</Label>
                <Input id="business" required value={form.business} onChange={e => setForm(f => ({ ...f, business: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="need">What do you need?</Label>
                <select
                  id="need"
                  required
                  value={form.need}
                  onChange={e => setForm(f => ({ ...f, need: e.target.value }))}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select an option...</option>
                  <option value="New website">New website</option>
                  <option value="Redesign">Redesign</option>
                  <option value="Landing page">Landing page</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Submit request"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Showcase items — swap in your real GIFs here ──────────────────────────────
const SHOWCASE_ITEMS = [
  {
    title: "Interior Design Studio",
    desc: "Elegant portfolio and booking site for a luxury design firm.",
    gif: "https://hdempuicehrxbjwlddpk.supabase.co/storage/v1/object/public/assets/landergif2.gif",
  },
  {
    title: "Restaurant & Menu",
    desc: "Mobile-first dining experience with online ordering.",
    gif: "",
  },
  {
    title: "Real Estate Agency",
    desc: "Property listings with map search and lead capture.",
    gif: "",
  },
  {
    title: "Fitness Studio",
    desc: "Class scheduling, memberships, and trainer bios.",
    gif: "",
  },
  {
    title: "E-commerce Store",
    desc: "Full product catalog with cart and checkout flow.",
    gif: "",
  },
  {
    title: "Professional Services",
    desc: "Law firm site with appointment booking integration.",
    gif: "",
  },
];

function ShowcaseCard({ title, desc, gif }: { title: string; desc: string; gif: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card transition-transform duration-200 hover:-translate-y-1">
      <div className="aspect-video w-full overflow-hidden bg-accent">
        {gif ? (
          <img
            src={gif}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            GIF coming soon
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-sm">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/app" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showModal && <QuoteModal onClose={() => setShowModal(false)} />}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="block sm:hidden">
          <FusionStackLogo iconSize={36} />
        </div>
        <div className="hidden sm:block">
          <FusionStackLogo iconSize={140} />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button onClick={() => setShowModal(true)}>Get started</Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 pt-16 pb-24">
        <section className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Built for digital agencies
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            The CRM that fits the way agencies actually work.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-muted-foreground">
            Track leads, manage your pipeline, and turn proposals into projects — without the bloat.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" onClick={() => setShowModal(true)}>
              Get a free quote <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </section>

        <section className="mt-24 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Users, title: "Contacts & Companies", desc: "Centralize every client, prospect, and partner." },
            { icon: Briefcase, title: "Visual pipeline", desc: "Drag deals from lead to launch in one board." },
            { icon: LayoutDashboard, title: "Live dashboard", desc: "Know your pipeline value at a glance." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* ── Showcase section ───────────────────────────────────────────── */}
        <section className="mt-32">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">See what we've built</h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Real sites we've designed and shipped for clients across industries.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SHOWCASE_ITEMS.map((item) => (
              <ShowcaseCard key={item.title} {...item} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button size="lg" onClick={() => setShowModal(true)}>
              Get your site built <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
