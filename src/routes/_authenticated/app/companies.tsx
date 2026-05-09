import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/app/companies")({
  component: CompaniesPage,
});

type Company = {
  id: string; name: string; industry: string | null; website: string | null;
  size: string | null; notes: string | null;
};

function CompaniesPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [editing, setEditing] = useState<Partial<Company> | null>(null);
  const [open, setOpen] = useState(false);

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
      if (c.id) {
        const { error } = await supabase.from("companies").update({
          name: c.name!, industry: c.industry ?? null, website: c.website ?? null,
          size: c.size ?? null, notes: c.notes ?? null,
        }).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("companies").insert({
          name: c.name!, industry: c.industry ?? null, website: c.website ?? null,
          size: c.size ?? null, notes: c.notes ?? null, created_by: user!.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["companies"] }); setOpen(false); toast.success("Saved"); },
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

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground">Clients, prospects, and partners.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({})}><Plus className="mr-1.5 h-4 w-4" /> New company</Button>
          </DialogTrigger>
          <CompanyDialog value={editing ?? {}} onChange={setEditing} onSave={() => save.mutate(editing!)} />
        </Dialog>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No companies yet.</TableCell></TableRow>
            )}
            {companies.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
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
        <div className="space-y-1.5"><Label>Website</Label><Input placeholder="https://" value={value.website ?? ""} onChange={(e) => set("website", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={3} value={value.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></div>
      </div>
      <DialogFooter><Button onClick={onSave} disabled={!value.name}>Save</Button></DialogFooter>
    </DialogContent>
  );
}
