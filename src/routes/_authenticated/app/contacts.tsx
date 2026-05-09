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

export const Route = createFileRoute("/_authenticated/app/contacts")({
  component: ContactsPage,
});

type ContactStatus = "new" | "lead" | "customer" | "spam" | "archived";
const STATUSES: ContactStatus[] = ["new", "lead", "customer", "spam", "archived"];

const STATUS_STYLES: Record<ContactStatus, string> = {
  new: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  lead: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  customer: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  spam: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  archived: "bg-muted text-muted-foreground border-border",
};

type Contact = {
  id: string; first_name: string; last_name: string | null; email: string | null;
  phone: string | null; title: string | null; source: string | null; notes: string | null;
  company_id: string | null; status: ContactStatus;
};

function ContactsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [editing, setEditing] = useState<Partial<Contact> | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<ContactStatus | "all">("all");

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Contact[];
    },
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies-list"],
    queryFn: async () => (await supabase.from("companies").select("id, name").order("name")).data ?? [],
  });

  const save = useMutation({
    mutationFn: async (c: Partial<Contact>) => {
      const payload = {
        first_name: c.first_name!, last_name: c.last_name ?? null, email: c.email ?? null,
        phone: c.phone ?? null, title: c.title ?? null, source: c.source ?? null,
        notes: c.notes ?? null, company_id: c.company_id || null,
        status: (c.status ?? "new") as ContactStatus,
      };
      if (c.id) {
        const { error } = await supabase.from("contacts").update(payload).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contacts").insert({ ...payload, created_by: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contacts"] }); setOpen(false); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContactStatus }) => {
      const { error } = await supabase.from("contacts").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contacts"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const companyName = (id: string | null) => companies.find((c) => c.id === id)?.name ?? "—";

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: contacts.length };
    for (const s of STATUSES) m[s] = 0;
    for (const c of contacts) m[c.status] = (m[c.status] ?? 0) + 1;
    return m;
  }, [contacts]);

  const filtered = filter === "all" ? contacts : contacts.filter((c) => c.status === filter);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">People in your network.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ status: "new" })}><Plus className="mr-1.5 h-4 w-4" /> New contact</Button>
          </DialogTrigger>
          <ContactDialog value={editing ?? {}} onChange={setEditing} companies={companies} onSave={() => save.mutate(editing!)} />
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
              <TableHead>Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No contacts.</TableCell></TableRow>
            )}
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.first_name} {c.last_name}</TableCell>
                <TableCell>
                  <Select value={c.status} onValueChange={(v) => updateStatus.mutate({ id: c.id, status: v as ContactStatus })}>
                    <SelectTrigger className={cn("h-7 w-[130px] border text-xs font-medium uppercase tracking-wide", STATUS_STYLES[c.status])}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{c.title ?? "—"}</TableCell>
                <TableCell>{companyName(c.company_id)}</TableCell>
                <TableCell>{c.email ?? "—"}</TableCell>
                <TableCell>{c.phone ?? "—"}</TableCell>
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

function ContactDialog({
  value, onChange, companies, onSave,
}: {
  value: Partial<Contact>;
  onChange: (v: Partial<Contact>) => void;
  companies: { id: string; name: string }[];
  onSave: () => void;
}) {
  const set = (k: keyof Contact, v: any) => onChange({ ...value, [k]: v });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{value.id ? "Edit contact" : "New contact"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>First name</Label><Input value={value.first_name ?? ""} onChange={(e) => set("first_name", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Last name</Label><Input value={value.last_name ?? ""} onChange={(e) => set("last_name", e.target.value)} /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={value.email ?? ""} onChange={(e) => set("email", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={value.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Title</Label><Input value={value.title ?? ""} onChange={(e) => set("title", e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Company</Label>
            <Select value={value.company_id ?? "none"} onValueChange={(v) => set("company_id", v === "none" ? null : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={value.status ?? "new"} onValueChange={(v) => set("status", v as ContactStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Source</Label><Input placeholder="Referral, website…" value={value.source ?? ""} onChange={(e) => set("source", e.target.value)} /></div>
        </div>
        <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={3} value={value.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></div>
      </div>
      <DialogFooter><Button onClick={onSave} disabled={!value.first_name}>Save</Button></DialogFooter>
    </DialogContent>
  );
}
