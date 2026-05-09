import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Users, Building2, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

const STAGE_LABELS: Record<string, string> = {
  lead: "Lead", qualified: "Qualified", proposal: "Proposal",
  negotiation: "Negotiation", won: "Won", lost: "Lost",
};

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [deals, contacts, companies] = await Promise.all([
        supabase.from("deals").select("*"),
        supabase.from("contacts").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }),
      ]);
      return {
        deals: deals.data ?? [],
        contactCount: contacts.count ?? 0,
        companyCount: companies.count ?? 0,
      };
    },
  });

  const deals = data?.deals ?? [];
  const openDeals = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const openValue = openDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);
  const wonThisMonth = deals.filter((d) => {
    if (d.stage !== "won") return false;
    const u = new Date(d.updated_at);
    const now = new Date();
    return u.getMonth() === now.getMonth() && u.getFullYear() === now.getFullYear();
  });
  const wonValue = wonThisMonth.reduce((s, d) => s + Number(d.value ?? 0), 0);

  const stageCounts = deals.reduce<Record<string, number>>((acc, d) => {
    acc[d.stage] = (acc[d.stage] ?? 0) + 1;
    return acc;
  }, {});

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your agency pipeline.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={TrendingUp} label="Open pipeline" value={fmt(openValue)} sub={`${openDeals.length} active deals`} />
        <Stat icon={Briefcase} label="Won this month" value={fmt(wonValue)} sub={`${wonThisMonth.length} deals`} />
        <Stat icon={Users} label="Contacts" value={String(data?.contactCount ?? 0)} sub="total" />
        <Stat icon={Building2} label="Companies" value={String(data?.companyCount ?? 0)} sub="total" />
      </div>

      <div className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-sm font-medium">Pipeline by stage</h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(["lead","qualified","proposal","negotiation","won","lost"] as const).map((s) => (
            <div key={s} className="rounded-lg border bg-background p-4">
              <div className="text-xs text-muted-foreground">{STAGE_LABELS[s]}</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{stageCounts[s] ?? 0}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
