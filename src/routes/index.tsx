import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Sparkles, Users, Briefcase, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/app" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-semibold">FusionHub</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild><Link to="/login">Sign in</Link></Button>
          <Button asChild><Link to="/signup">Get started</Link></Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-16 pb-24">
        <section className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Built for digital agencies
          </div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
            The CRM that fits the way agencies actually work.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Track leads, manage your pipeline, and turn proposals into projects — without the bloat.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/signup">Start free <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign in</Link>
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
      </main>
    </div>
  );
}
