import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil } from "lucide-react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/app/deals")({
  component: DealsPage,
});

type Stage = "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
type ServiceType = "web_design" | "web_development" | "seo" | "branding" | "marketing" | "other";

type Deal = {
  id: string; title: string; stage: Stage; service_type: ServiceType;
  value: number | null; expected_close_date: string | null; notes: string | null;
  contact_id: string | null; company_id: string | null;
};

const STAGES: { id: Stage; label: string }[] = [
  { id: "lead", label: "Lead" },
  { id: "qualified", label: "Qualified" },
  { id: "proposal", label: "Proposal" },
  { id: "negotiation", label: "Negotiation" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];

const SERVICE_LABELS: Record<ServiceType, string> = {
  web_design: "Web Design", web_development: "Web Development", seo: "SEO",
  branding: "Branding", marketing: "Marketing", other: "Other",
};

function DealsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [editing, setEditing] = useState<Partial<Deal> | null>(null);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: deals = [] } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Deal[];
    },
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies-list"],
    queryFn: async () => (await supabase.from("companies").select("id, name").order("name")).data ?? [],
  });
  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts-list"],
    queryFn: async () => (await supabase.from("contacts").select("id, first_name, last_name").order("first_name")).data ?? [],
  });

  const byStage = useMemo(() => {
    const m: Record<Stage, Deal[]> = { lead: [], qualified: [], proposal: [], negotiation: [], won: [], lost: [] };
    deals.forEach((d) => m[d.stage].push(d));
    return m;
  }, [deals]);

  const save = useMutation({
    mutationFn: async (d: Partial<Deal>) => {
      const payload = {
        title: d.title!, stage: (d.stage ?? "lead") as Stage,
        service_type: (d.service_type ?? "web_development") as ServiceType,
        value: d.value ?? 0, expected_close_date: d.expected_close_date || null,
        notes: d.notes ?? null, contact_id: d.contact_id || null, company_id: d.company_id || null,
      };
      if (d.id) {
        const { error } = await supabase.from("deals").update(payload).eq("id", d.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("deals").insert({ ...payload, created_by: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["deals"] }); setOpen(false); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const moveStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: Stage }) => {
      const { error } = await supabase.from("deals").update({ stage }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: ["deals"] });
      const prev = qc.getQueryData<Deal[]>(["deals"]);
      qc.setQueryData<Deal[]>(["deals"], (old) => old?.map((d) => d.id === id ? { ...d, stage } : d) ?? []);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["deals"], ctx.prev); toast.error("Failed to move"); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["deals"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["deals"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const id = e.active.id as string;
    const newStage = e.over?.id as Stage | undefined;
    if (!newStage) return;
    const deal = deals.find((d) => d.id === id);
    if (!deal || deal.stage === newStage) return;
    moveStage.mutate({ id, stage: newStage });
  };

  const activeDeal = deals.find((d) => d.id === activeId);
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Deals</h1>
          <p className="text-sm text-muted-foreground">Drag deals across stages to update them.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({})}><Plus className="mr-1.5 h-4 w-4" /> New deal</Button>
          </DialogTrigger>
          <DealDialog value={editing ?? {}} onChange={setEditing} companies={companies} contacts={contacts} onSave={() => save.mutate(editing!)} />
        </Dialog>
      </div>

      <DndContext sensors={sensors} onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((s) => (
            <Column key={s.id} stage={s.id} label={s.label} deals={byStage[s.id]} fmt={fmt}
              onEdit={(d) => { setEditing(d); setOpen(true); }} onDelete={(id) => del.mutate(id)} />
          ))}
        </div>
        <DragOverlay>
          {activeDeal && <DealCard deal={activeDeal} fmt={fmt} dragging />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({ stage, label, deals, fmt, onEdit, onDelete }: {
  stage: Stage; label: string; deals: Deal[]; fmt: (n: number) => string;
  onEdit: (d: Deal) => void; onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = deals.reduce((s, d) => s + Number(d.value ?? 0), 0);
  return (
    <div ref={setNodeRef} className={`rounded-xl border bg-card p-3 transition-colors ${isOver ? "border-primary bg-accent" : ""}`}>
      <div className="mb-3 flex items-baseline justify-between px-1">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-xs tabular-nums text-muted-foreground">{deals.length} · {fmt(total)}</div>
      </div>
      <div className="flex flex-col gap-2 min-h-[100px]">
        {deals.map((d) => <DealCard key={d.id} deal={d} fmt={fmt} onEdit={() => onEdit(d)} onDelete={() => onDelete(d.id)} />)}
      </div>
    </div>
  );
}

function DealCard({ deal, fmt, dragging, onEdit, onDelete }: {
  deal: Deal; fmt: (n: number) => string; dragging?: boolean;
  onEdit?: () => void; onDelete?: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      className={`group rounded-lg border bg-background p-3 shadow-sm cursor-grab active:cursor-grabbing ${isDragging || dragging ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium leading-tight">{deal.title}</div>
        {onEdit && (
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onEdit(); }}><Pencil className="h-3 w-3" /></Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDelete?.(); }}><Trash2 className="h-3 w-3" /></Button>
          </div>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{SERVICE_LABELS[deal.service_type]}</div>
      <div className="mt-2 text-sm font-semibold tabular-nums">{fmt(Number(deal.value ?? 0))}</div>
    </div>
  );
}

function DealDialog({ value, onChange, companies, contacts, onSave }: {
  value: Partial<Deal>;
  onChange: (v: Partial<Deal>) => void;
  companies: { id: string; name: string }[];
  contacts: { id: string; first_name: string; last_name: string | null }[];
  onSave: () => void;
}) {
  const set = (k: keyof Deal, v: any) => onChange({ ...value, [k]: v });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{value.id ? "Edit deal" : "New deal"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5"><Label>Title</Label><Input value={value.title ?? ""} onChange={(e) => set("title", e.target.value)} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Stage</Label>
            <Select value={value.stage ?? "lead"} onValueChange={(v) => set("stage", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Service</Label>
            <Select value={value.service_type ?? "web_development"} onValueChange={(v) => set("service_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(SERVICE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Value (USD)</Label><Input type="number" value={value.value ?? ""} onChange={(e) => set("value", e.target.value === "" ? null : Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Expected close</Label><Input type="date" value={value.expected_close_date ?? ""} onChange={(e) => set("expected_close_date", e.target.value)} /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
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
          <div className="space-y-1.5">
            <Label>Contact</Label>
            <Select value={value.contact_id ?? "none"} onValueChange={(v) => set("contact_id", v === "none" ? null : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name ?? ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={3} value={value.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></div>
      </div>
      <DialogFooter><Button onClick={onSave} disabled={!value.title}>Save</Button></DialogFooter>
    </DialogContent>
  );
}
