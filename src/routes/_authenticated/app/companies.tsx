import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/companies")({
  component: CompaniesPage,
});

type CompanyStatus = "new" | "lead" | "customer" | "spam" | "archived";
const STATUSES: CompanyStatus[] = ["new", "lead", "customer", "spam", "archived"];

const STATUS_STYLES: Record<CompanyStatus, string> = {
  new: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  lead: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  customer: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  spam: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  archived: "bg-muted text-muted-foreground border-border",
};

type Company = {
  id: string; name: string; industry: string | null; website: string | null;
  size: string | null; notes: string | null; status: CompanyStatus;
};

function CompaniesPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [editing, setEditing] = useState<Partial<Company> | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<CompanyStatus | "all">("all");

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Company[];
    },
  });

  const save = useMutation({
    mutationFn: async (c: Partial<Company>) => {
      const payload = {
        name: c.name!, industry: c.industry ?? null, website: c.website ?? null,
        size: c.size ?? null, notes: c.notes ?? null,
        status: (c.status ?? "new") as CompanyStatus,
      };
      if (c.id) {
        const { error } = await supabase.from("companies").update(payload).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("companies").insert({ ...payload, created_by: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["companies"] }); setOpen(false); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CompanyStatus }) => {
      const { error } = await supabase.from("companies").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["companies"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: companies.length };
    for (const s of STATUSES) m[s] = 0;
    for (const c of companies) m[c.status] = (m[c.status] ?? 0) + 1;
    return m;
  }, [companies]);

  const filtered = filter === "all" ? companies : companies.filter((c) => c.status === filter);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground">Clients, prospects, and partners.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ status: "new" })}><Plus className="mr-1.5 h-4 w-4" /> New company</Button>
          </DialogTrigger>
          <CompanyDialog value={editing ?? {}} onChange={setEditing} onSave={() => save.mutate(editing!)} />
        </Dialog>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <StatusChip label="All" active={filter === "all"} count={counts.all} onClick={() => setFilter("all")} />
        {STATUSES.map((s) => (
          <StatusChip
            key={s}
            label={s}
            active={filter === s}
            count={counts[s] ?? 0}
            className={STATUS_STYLES[s]}
            onClick={() => setFilter(s)}
          />
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No companies.</TableCell></TableRow>
            )}
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  <Select value={c.status} onValueChange={(v) => updateStatus.mutate({ id: c.id, status: v as CompanyStatus })}>
                    <SelectTrigger className={cn("h-7 w-[130px] border text-xs font-medium uppercase tracking-wide", STATUS_STYLES[c.status])}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{c.industry ?? "—"}</TableCell>
                <TableCell>{c.website ? <a href={c.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{c.website}</a> : "—"}</TableCell>
                <TableCell>{c.size ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusChip({
  label, active, count, className, onClick,
}: { label: string; active: boolean; count: number; className?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide transition-all",
        active ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "opacity-70 hover:opacity-100",
        className ?? "bg-card text-foreground border-border",
      )}
    >
      <span>{label}</span>
      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{count}</Badge>
    </button>
  );
}

function CompanyDialog({ value, onChange, onSave }: { value: Partial<Company>; onChange: (v: Partial<Company>) => void; onSave: () => void }) {
  const set = (k: keyof Company, v: any) => onChange({ ...value, [k]: v });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{value.id ? "Edit company" : "New company"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5"><Label>Name</Label><Input value={value.name ?? ""} onChange={(e) => set("name", e.target.value)} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Industry</Label><Input value={value.industry ?? ""} onChange={(e) => set("industry", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Size</Label><Input placeholder="1-10, 11-50…" value={value.size ?? ""} onChange={(e) => set("size", e.target.value)} /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={value.status ?? "new"} onValueChange={(v) => set("status", v as CompanyStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Website</Label><Input placeholder="https://" value={value.website ?? ""} onChange={(e) => set("website", e.target.value)} /></div>
        </div>
        <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={3} value={value.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></div>
      </div>
      <DialogFooter><Button onClick={onSave} disabled={!value.name}>Save</Button></DialogFooter>
    </DialogContent>
  );
}
