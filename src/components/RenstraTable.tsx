import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  YEARS,
  capaian,
  formatIDR,
  getStatus,
  type Year,
} from "@/lib/renstra-data";
import { useRenstra } from "@/hooks/use-renstra";
import {
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  ChevronRight,
} from "lucide-react";

const STATUS_CLASS: Record<string, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/20 text-warning-foreground border-warning/40",
  danger: "bg-danger/15 text-danger border-danger/30",
  neutral: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABEL: Record<string, string> = {
  success: "Tercapai",
  warning: "Hampir",
  danger: "Kurang",
  neutral: "—",
};

export function RenstraTable() {
  const {
    programs,
    updateValue,
    addProgram,
    addSasaran,
    addIndikator,
    deleteIndikator,
    reset,
  } = useRenstra();

  const [yearFilter, setYearFilter] = useState<Year | "all">("all");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [editTarget, setEditTarget] = useState<null | {
    programId: string;
    sasaranId: string;
    indikatorId: string;
    nama: string;
    satuan: string;
  }>(null);

  const yearsToShow: Year[] = yearFilter === "all" ? [...YEARS] : [yearFilter];

  const visiblePrograms = useMemo(
    () => (programFilter === "all" ? programs : programs.filter((p) => p.id === programFilter)),
    [programs, programFilter],
  );

  const editingIndikator = useMemo(() => {
    if (!editTarget) return null;
    const p = programs.find((x) => x.id === editTarget.programId);
    const s = p?.sasaran.find((x) => x.id === editTarget.sasaranId);
    return s?.indikator.find((x) => x.id === editTarget.indikatorId) ?? null;
  }, [editTarget, programs]);

  const exportExcel = () => {
    const rows: Record<string, string | number>[] = [];
    for (const p of visiblePrograms) {
      for (const s of p.sasaran) {
        for (const ind of s.indikator) {
          const row: Record<string, string | number> = {
            Program: p.nama,
            "Sasaran Strategis": s.nama,
            "Indikator Kinerja": ind.nama,
            Satuan: ind.satuan,
          };
          for (const y of yearsToShow) {
            const v = ind.values[y];
            row[`Target ${y}`] = v.target;
            row[`Realisasi ${y}`] = v.actual;
            row[`Capaian ${y} (%)`] = Number(capaian(v.actual, v.target).toFixed(2));
            row[`Pagu ${y}`] = v.budget;
          }
          rows.push(row);
        }
      }
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Renstra 2025-2029");
    XLSX.writeFile(wb, `renstra-monitoring-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-5">
      {/* Filters & actions */}
      <Card className="shadow-elegant">
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3 justify-between">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Tahun
                </Label>
                <Select
                  value={String(yearFilter)}
                  onValueChange={(v) => setYearFilter(v === "all" ? "all" : (Number(v) as Year))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tahun</SelectItem>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Program
                </Label>
                <Select value={programFilter} onValueChange={setProgramFilter}>
                  <SelectTrigger className="w-[320px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Program</SelectItem>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AddProgramDialog onAdd={addProgram} />
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={exportExcel}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">Status capaian:</span>
            <LegendDot className="bg-success" label="≥ 100% Tercapai" />
            <LegendDot className="bg-warning" label="75% – 99% Hampir tercapai" />
            <LegendDot className="bg-danger" label="< 75% Kurang" />
          </div>
        </CardContent>
      </Card>

      {/* Hierarchical table */}
      <Card className="shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="w-[320px] text-foreground font-semibold">
                  Indikator Kinerja
                </TableHead>
                <TableHead className="w-[80px] text-foreground font-semibold">Satuan</TableHead>
                {yearsToShow.map((y) => (
                  <TableHead key={y} className="text-center border-l border-border">
                    <div className="font-semibold text-foreground">{y}</div>
                    <div className="grid grid-cols-4 gap-1 mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span>Target</span>
                      <span>Real.</span>
                      <span>Cap.</span>
                      <span>Pagu</span>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-[110px] text-right text-foreground font-semibold">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiblePrograms.map((p) => (
                <ProgramBlock
                  key={p.id}
                  program={p}
                  yearsToShow={yearsToShow}
                  onEdit={(s, i) =>
                    setEditTarget({
                      programId: p.id,
                      sasaranId: s.id,
                      indikatorId: i.id,
                      nama: i.nama,
                      satuan: i.satuan,
                    })
                  }
                  onDelete={(s, i) => deleteIndikator(p.id, s.id, i.id)}
                  onAddSasaran={(nama) => addSasaran(p.id, nama)}
                  onAddIndikator={(sId, nama, sat) => addIndikator(p.id, sId, nama, sat)}
                />
              ))}
              {visiblePrograms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3 + yearsToShow.length} className="text-center py-12 text-muted-foreground">
                    Belum ada program. Tambahkan program baru untuk memulai.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Side panel for editing yearly values */}
      <Sheet open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          {editTarget && editingIndikator && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Target & Realisasi</SheetTitle>
                <SheetDescription>
                  <span className="font-medium text-foreground">{editTarget.nama}</span>
                  <span className="text-muted-foreground"> · {editTarget.satuan}</span>
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {YEARS.map((y) => {
                  const v = editingIndikator.values[y];
                  const c = capaian(v.actual, v.target);
                  const status = getStatus(v.actual, v.target);
                  return (
                    <div key={y} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold text-foreground">Tahun {y}</div>
                        <Badge className={STATUS_CLASS[status]} variant="outline">
                          {STATUS_LABEL[status]} · {c.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <NumberField
                          label="Target"
                          value={v.target}
                          onChange={(n) =>
                            updateValue(editTarget.programId, editTarget.sasaranId, editTarget.indikatorId, y, "target", n)
                          }
                        />
                        <NumberField
                          label="Realisasi"
                          value={v.actual}
                          onChange={(n) =>
                            updateValue(editTarget.programId, editTarget.sasaranId, editTarget.indikatorId, y, "actual", n)
                          }
                        />
                        <NumberField
                          label="Pagu (Rp)"
                          value={v.budget}
                          onChange={(n) =>
                            updateValue(editTarget.programId, editTarget.sasaranId, editTarget.indikatorId, y, "budget", n)
                          }
                        />
                      </div>
                      <Progress value={Math.min(c, 100)} className="mt-3 h-1.5" />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function ProgramBlock({
  program,
  yearsToShow,
  onEdit,
  onDelete,
  onAddSasaran,
  onAddIndikator,
}: {
  program: import("@/lib/renstra-data").Program;
  yearsToShow: Year[];
  onEdit: (s: import("@/lib/renstra-data").Sasaran, i: import("@/lib/renstra-data").Indikator) => void;
  onDelete: (s: import("@/lib/renstra-data").Sasaran, i: import("@/lib/renstra-data").Indikator) => void;
  onAddSasaran: (nama: string) => void;
  onAddIndikator: (sasaranId: string, nama: string, satuan: string) => void;
}) {
  const colSpan = 3 + yearsToShow.length;

  return (
    <>
      <TableRow className="bg-primary/5 hover:bg-primary/5 border-t-2 border-primary/20">
        <TableCell colSpan={colSpan} className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px] bg-primary text-primary-foreground border-primary">
                PROGRAM
              </Badge>
              <span className="font-semibold text-foreground">{program.nama}</span>
            </div>
            <AddSasaranDialog onAdd={onAddSasaran} />
          </div>
        </TableCell>
      </TableRow>

      {program.sasaran.map((s) => (
        <SasaranBlock
          key={s.id}
          sasaran={s}
          yearsToShow={yearsToShow}
          colSpan={colSpan}
          onEdit={(i) => onEdit(s, i)}
          onDelete={(i) => onDelete(s, i)}
          onAddIndikator={(nama, sat) => onAddIndikator(s.id, nama, sat)}
        />
      ))}

      {program.sasaran.length === 0 && (
        <TableRow>
          <TableCell colSpan={colSpan} className="text-center text-xs text-muted-foreground py-4">
            Belum ada sasaran strategis pada program ini.
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function SasaranBlock({
  sasaran,
  yearsToShow,
  colSpan,
  onEdit,
  onDelete,
  onAddIndikator,
}: {
  sasaran: import("@/lib/renstra-data").Sasaran;
  yearsToShow: Year[];
  colSpan: number;
  onEdit: (i: import("@/lib/renstra-data").Indikator) => void;
  onDelete: (i: import("@/lib/renstra-data").Indikator) => void;
  onAddIndikator: (nama: string, satuan: string) => void;
}) {
  return (
    <>
      <TableRow className="bg-muted/30 hover:bg-muted/30">
        <TableCell colSpan={colSpan} className="py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 pl-4">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <Badge variant="outline" className="font-mono text-[10px]">
                SASARAN
              </Badge>
              <span className="text-sm text-foreground">{sasaran.nama}</span>
            </div>
            <AddIndikatorDialog onAdd={onAddIndikator} />
          </div>
        </TableCell>
      </TableRow>

      {sasaran.indikator.map((ind) => (
        <TableRow key={ind.id} className="hover:bg-muted/20">
          <TableCell className="pl-12">
            <div className="text-sm font-medium text-foreground">{ind.nama}</div>
          </TableCell>
          <TableCell className="text-xs text-muted-foreground">{ind.satuan}</TableCell>
          {yearsToShow.map((y) => {
            const v = ind.values[y];
            const c = capaian(v.actual, v.target);
            const status = getStatus(v.actual, v.target);
            return (
              <TableCell key={y} className="border-l border-border p-2">
                <div className="grid grid-cols-4 gap-1 text-xs text-center items-center">
                  <span className="font-mono text-foreground">{v.target || "—"}</span>
                  <span className="font-mono text-foreground">{v.actual || "—"}</span>
                  <span
                    className={`font-mono px-1.5 py-0.5 rounded text-[11px] border ${STATUS_CLASS[status]}`}
                  >
                    {v.target ? `${c.toFixed(0)}%` : "—"}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground truncate" title={formatIDR(v.budget)}>
                    {v.budget ? formatIDR(v.budget) : "—"}
                  </span>
                </div>
              </TableCell>
            );
          })}
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(ind)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-danger hover:text-danger"
                onClick={() => onDelete(ind)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-9 font-mono text-sm"
      />
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function AddProgramDialog({ onAdd }: { onAdd: (nama: string) => void }) {
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Program
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Program</DialogTitle>
          <DialogDescription>Program baru pada Renstra 2025-2029.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Nama Program</Label>
          <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Program Peningkatan ..." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            onClick={() => {
              if (!nama.trim()) return;
              onAdd(nama.trim());
              setNama("");
              setOpen(false);
            }}
          >
            Tambah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddSasaranDialog({ onAdd }: { onAdd: (nama: string) => void }) {
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" /> Sasaran
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Sasaran Strategis</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Nama Sasaran</Label>
          <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Meningkatnya ..." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            onClick={() => {
              if (!nama.trim()) return;
              onAdd(nama.trim());
              setNama("");
              setOpen(false);
            }}
          >
            Tambah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddIndikatorDialog({ onAdd }: { onAdd: (nama: string, satuan: string) => void }) {
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [satuan, setSatuan] = useState("%");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" /> Indikator
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Indikator Kinerja</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nama Indikator</Label>
            <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Persentase ..." />
          </div>
          <div className="space-y-1.5">
            <Label>Satuan</Label>
            <Input value={satuan} onChange={(e) => setSatuan(e.target.value)} placeholder="% / Skor / Orang / Indeks" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            onClick={() => {
              if (!nama.trim() || !satuan.trim()) return;
              onAdd(nama.trim(), satuan.trim());
              setNama("");
              setOpen(false);
            }}
          >
            Tambah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
