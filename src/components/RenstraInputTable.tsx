import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRenstra } from "@/hooks/use-renstra";
import { YEARS, MONTHS, type Year, type Program } from "@/lib/renstra-data";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function RenstraInputTable() {
  const { 
    programs, 
    updateValue, 
    updateIndikator, 
    addIndikator, 
    deleteIndikator,
    addProgram,
    addSasaran 
  } = useRenstra();
  const [selectedYear, setSelectedYear] = useState<Year | "all">("all");
  const [selectedMonth, setSelectedMonth] = useState<number>(0);

  const activeYears = useMemo(
    () => (selectedYear === "all" ? [...YEARS] : [selectedYear]),
    [selectedYear]
  );

  const flatData = useMemo(() => {
    const list: any[] = [];
    let no = 1;
    programs.forEach((p) => {
      p.sasaran.forEach((s) => {
        s.indikator.forEach((i) => {
          list.push({
            no: no++,
            misi: p.nama,
            sasaran: s.nama,
            ...i,
          });
        });
      });
    });
    return list;
  }, [programs]);

  return (
    <div className="space-y-4">
      <Card className="p-4 border bg-background/50 backdrop-blur-md shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              Filter Tahun
            </Label>
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => setSelectedYear(v === "all" ? "all" : (Number(v) as Year))}
            >
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder="Semua Tahun" />
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
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              Filter Bulan / Mode Input
            </Label>
            <Select
              value={String(selectedMonth)}
              onValueChange={(v) => setSelectedMonth(Number(v))}
            >
              <SelectTrigger className="w-48 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.id === 0 ? "Mode: Target Tahunan" : `Mode: Realisasi ${m.name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 flex flex-wrap items-center justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const name = prompt("Nama Program Baru:");
                if (name) addProgram(name);
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Program
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const pId = prompt("ID Program (atau pilih dari list):");
                const name = prompt("Nama Sasaran Baru:");
                if (pId && name) addSasaran(pId, name);
              }}
              className="hidden" // Hiding manual prompt version, using dialog instead
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Sasaran
            </Button>
            
            <AddSasaranExcelDialog programs={programs} onAdd={addSasaran} />
            <AddRowDialog programs={programs} onAdd={addIndikator} />
          </div>
        </div>
      </Card>

      <Card className="shadow-elegant overflow-hidden border bg-background/50 backdrop-blur-md">
        <div className="overflow-x-auto max-h-[75vh] scrollbar-thin scrollbar-thumb-primary/20">
          <Table className="min-w-[2400px] text-[11px] border-separate border-spacing-0">
            <TableHeader className="sticky top-0 bg-secondary/95 backdrop-blur-md z-30 shadow-sm">
              <TableRow className="divide-x divide-border">
                <TableHead className="w-12 text-center font-bold text-foreground border-b sticky left-0 bg-secondary z-40">#</TableHead>
                <TableHead className="w-64 font-bold text-foreground border-b sticky left-12 bg-secondary z-40">Misi / Program</TableHead>
                <TableHead className="w-48 font-bold text-foreground border-b">BAGIAN</TableHead>
                <TableHead className="w-48 font-bold text-foreground border-b">Borang Akreditasi AIPT</TableHead>
                <TableHead className="w-24 font-bold text-foreground border-b text-center">KODE</TableHead>
                <TableHead className="w-[450px] font-bold text-foreground border-b">INDIKATOR KINERJA RENSTRA</TableHead>
                <TableHead className="w-24 font-bold text-foreground border-b text-center">IKU/IKT</TableHead>
                <TableHead className="w-28 font-bold text-foreground border-b text-center bg-amber-50/50">BASELINE</TableHead>
                {activeYears.map((y) => (
                  <TableHead key={y} className="w-32 font-bold text-foreground border-b text-center bg-primary/5">
                    {y} {selectedMonth === 0 ? "(Target)" : `(Real. ${MONTHS[selectedMonth].name})`}
                  </TableHead>
                ))}
                <TableHead className="w-32 font-bold text-foreground border-b text-center">SATUAN</TableHead>
                <TableHead className="w-72 font-bold text-foreground border-b">PENJELASAN</TableHead>
                <TableHead className="w-48 font-bold text-foreground border-b">PIC</TableHead>
                <TableHead className="w-16 font-bold text-foreground border-b text-center">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flatData.map((row) => (
                <TableRow key={row.id} className="hover:bg-primary/5 transition-colors group divide-x divide-border">
                  <TableCell className="text-center font-medium border-b sticky left-0 bg-background group-hover:bg-primary/5 z-20 flex items-center justify-center h-full">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default">{row.no}</span>
                        </TooltipTrigger>
                        <TooltipContent>ID: {row.id.slice(0,8)}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="font-medium border-b sticky left-12 bg-muted/30 group-hover:bg-primary/5 z-20 truncate max-w-[256px]">
                    {row.misi}
                  </TableCell>
                  <TableCell className="p-0 border-b">
                    <Input
                      className="h-9 text-[11px] border-none focus-visible:ring-1 focus-visible:ring-primary/40 bg-transparent group-hover:bg-background/50 rounded-none px-3"
                      defaultValue={row.bagian}
                      onBlur={(e) => updateIndikator(row.id, { bagian: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="p-0 border-b">
                    <Input
                      className="h-9 text-[11px] border-none focus-visible:ring-1 focus-visible:ring-primary/40 bg-transparent group-hover:bg-background/50 rounded-none px-3"
                      defaultValue={row.borang_aipt}
                      onBlur={(e) => updateIndikator(row.id, { borang_aipt: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="p-0 border-b">
                    <Input
                      className="h-9 text-[11px] border-none focus-visible:ring-1 focus-visible:ring-primary/40 bg-transparent group-hover:bg-background/50 rounded-none px-3 text-center font-mono"
                      defaultValue={row.kode}
                      onBlur={(e) => updateIndikator(row.id, { kode: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="p-0 border-b">
                    <Input
                      className="h-9 text-[11px] border-none focus-visible:ring-1 focus-visible:ring-primary/40 bg-transparent group-hover:bg-background/50 rounded-none px-3 font-semibold text-primary"
                      defaultValue={row.nama}
                      onBlur={(e) => updateIndikator(row.id, { nama: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="p-0 border-b text-center align-middle">
                    <div className="flex items-center justify-center h-9">
                       <Checkbox 
                        checked={row.iku_ikt === "IKU"}
                        onCheckedChange={(checked) => updateIndikator(row.id, { iku_ikt: checked ? "IKU" : "IKT" })}
                        className="data-[state=checked]:bg-primary"
                       />
                       <span className="ml-2 text-[9px] font-bold text-muted-foreground">{row.iku_ikt || "IKT"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="p-0 border-b bg-amber-50/20">
                    <Input
                      type="number"
                      className="h-9 text-[11px] border-none focus-visible:ring-1 focus-visible:ring-primary/40 bg-transparent group-hover:bg-background/50 rounded-none px-3 text-center font-mono"
                      defaultValue={row.baseline}
                      onBlur={(e) => updateIndikator(row.id, { baseline: Number(e.target.value) || 0 })}
                    />
                  </TableCell>
                  {activeYears.map((y) => {
                    const val = row.values[y];
                    const displayValue = selectedMonth === 0 ? val?.target : val?.months[selectedMonth]?.actual || 0;
                    return (
                      <TableCell key={y} className="p-0 border-b bg-primary/5">
                        <Input
                          type="number"
                          key={`${row.id}-${y}-${selectedMonth}`}
                          className="h-9 text-[11px] border-none focus-visible:ring-1 focus-visible:ring-primary/40 bg-transparent group-hover:bg-background/50 rounded-none px-3 text-center font-mono"
                          defaultValue={displayValue}
                          onBlur={(e) => 
                            updateValue(row.id, y as Year, selectedMonth === 0 ? "target" : "actual", Number(e.target.value) || 0, selectedMonth)
                          }
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell className="p-0 border-b">
                    <Input
                      className="h-9 text-[11px] border-none focus-visible:ring-1 focus-visible:ring-primary/40 bg-transparent group-hover:bg-background/50 rounded-none px-3 text-center"
                      defaultValue={row.satuan}
                      onBlur={(e) => updateIndikator(row.id, { satuan: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="p-0 border-b">
                    <Input
                      className="h-9 text-[11px] border-none focus-visible:ring-1 focus-visible:ring-primary/40 bg-transparent group-hover:bg-background/50 rounded-none px-3"
                      defaultValue={row.penjelasan}
                      onBlur={(e) => updateIndikator(row.id, { penjelasan: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="p-0 border-b">
                    <Input
                      className="h-9 text-[11px] border-none focus-visible:ring-1 focus-visible:ring-primary/40 bg-transparent group-hover:bg-background/50 rounded-none px-3"
                      defaultValue={row.pic}
                      onBlur={(e) => updateIndikator(row.id, { pic: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="p-0 border-b text-center align-middle">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        if (confirm("Hapus baris ini?")) {
                          deleteIndikator("", "", row.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function AddRowDialog({ programs, onAdd }: { programs: Program[], onAdd: any }) {
  const [open, setOpen] = useState(false);
  const [sasaranId, setSasaranId] = useState("");
  const [nama, setNama] = useState("");
  const [satuan, setSatuan] = useState("%");

  const sasarans = useMemo(() => {
    return programs.flatMap(p => p.sasaran.map(s => ({ ...s, programName: p.nama })));
  }, [programs]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-elegant bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Baris Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Indikator Baru</DialogTitle>
          <DialogDescription>
            Pilih Sasaran Strategis dan masukkan nama indikator baru.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Sasaran Strategis</Label>
            <Select value={sasaranId} onValueChange={setSasaranId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Sasaran..." />
              </SelectTrigger>
              <SelectContent>
                {sasarans.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="text-[10px] text-muted-foreground block">{s.programName}</span>
                    <span className="font-medium">{s.nama}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nama Indikator</Label>
            <Input 
              value={nama} 
              onChange={(e) => setNama(e.target.value)} 
              placeholder="Contoh: Persentase Capaian..." 
            />
          </div>
          <div className="space-y-2">
            <Label>Satuan</Label>
            <Input 
              value={satuan} 
              onChange={(e) => setSatuan(e.target.value)} 
              placeholder="% / Skor / Orang" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button 
            disabled={!sasaranId || !nama}
            onClick={() => {
              onAdd("", sasaranId, nama, satuan);
              setNama("");
              setOpen(false);
              toast.success("Baris baru ditambahkan!");
            }}
          >
            Tambahkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddSasaranExcelDialog({ programs, onAdd }: { programs: Program[], onAdd: any }) {
  const [open, setOpen] = useState(false);
  const [programId, setProgramId] = useState("");
  const [nama, setNama] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-3.5 h-3.5 mr-1" /> Sasaran
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Sasaran Baru</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Pilih Program</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Program..." />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nama Sasaran</Label>
            <Input 
              value={nama} 
              onChange={(e) => setNama(e.target.value)} 
              placeholder="Contoh: Meningkatnya kualitas..." 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button 
            disabled={!programId || !nama}
            onClick={() => {
              onAdd(programId, nama);
              setNama("");
              setOpen(false);
              toast.success("Sasaran baru ditambahkan!");
            }}
          >
            Tambahkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
