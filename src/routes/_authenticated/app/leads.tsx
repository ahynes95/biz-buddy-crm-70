import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/leads")({
  component: LeadsPage,
});

type LeadStatus = "new" | "contacted" | "qualified" | "closed";
const STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "closed"];

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  contacted: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  qualified: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  closed: "bg-muted text-muted-foreground border-border",
};

type Lead = {
  id: string;
  name: string;
  email: string;
  business: string;
  need: string;
  status: LeadStatus;
  created_at: string;
};

function LeadsPage() {
  const qc = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { error } = await (supabase as any).from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const counts: Record<string, number> = { all: leads.length };
  for (const s of STATUSES) counts[s] = 0;
  for (const l of leads) counts[l.status] = (counts[l.status] ?? 0) + 1;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">Quote requests from your website.</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <div
            key={s}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide",
              STATUS_STYLES[s],
            )}
          >
            <span>{s}</span>
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{counts[s]}</Badge>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Need</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No leads yet.
                </TableCell>
              </TableRow>
            )}
            {leads.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.name}</TableCell>
                <TableCell>{l.email}</TableCell>
                <TableCell>{l.business}</TableCell>
                <TableCell>{l.need}</TableCell>
                <TableCell>
                  <Select
                    value={l.status}
                    onValueChange={(v) => updateStatus.mutate({ id: l.id, status: v as LeadStatus })}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-7 w-[130px] border text-xs font-medium uppercase tracking-wide",
                        STATUS_STYLES[l.status] ?? STATUS_STYLES.new,
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(l.created_at).toLocaleDateString(undefined, {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
