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
import { Plus, Trash2, Check, LayoutGrid, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export function RenstraInputTable() {
  const { 
    programs, 
    updateValue, 
    updateIndikator, 
    addIndikator, 
    deleteIndikator,
    addProgram,
    deleteProgram,
    addSasaran 
  } = useRenstra();
  
  const [selectedYear, setSelectedYear] = useState<Year>(YEARS[0]);

  // Generate 12 months for the headers (excluding "Tahunan" ID 0)
  const monthlyHeaders = MONTHS.filter(m => m.id !== 0);

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="p-4 border bg-background/50 backdrop-blur-md shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Tahun Target/Realisasi
              </Label>
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v) as Year)}
              >
                <SelectTrigger className="w-40 h-9 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={() => {
              const name = prompt("Nama Misi (Program) Baru:");
              if (name) addProgram(name);
            }}
            className="shadow-elegant"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Misi Baru
          </Button>
        </div>
      </Card>

      {/* Spreadsheet Table */}
      <Card className="shadow-elegant overflow-hidden border bg-background/50 backdrop-blur-md">
        <div className="overflow-x-auto max-h-[75vh] scrollbar-thin scrollbar-thumb-primary/20">
          <Table className="min-w-[2800px] text-[11px] border-separate border-spacing-0">
            <TableHeader className="sticky top-0 bg-secondary/95 backdrop-blur-md z-30 shadow-sm">
              <TableRow className="divide-x divide-border">
                <TableHead className="w-12 text-center font-bold text-foreground border-b sticky left-0 bg-secondary z-40">No</TableHead>
                <TableHead className="w-64 font-bold text-foreground border-b sticky left-12 bg-secondary z-40">Misi (Program)</TableHead>
                <TableHead className="w-48 font-bold text-foreground border-b">BAGIAN</TableHead>
                <TableHead className="w-48 font-bold text-foreground border-b">Borang Akreditasi AIPT</TableHead>
                <TableHead className="w-24 font-bold text-foreground border-b text-center">KODE</TableHead>
                <TableHead className="w-[400px] font-bold text-foreground border-b">INDIKATOR KINERJA RENSTRA</TableHead>
                <TableHead className="w-24 font-bold text-foreground border-b text-center">IKU/IKT</TableHead>
                <TableHead className="w-24 font-bold text-foreground border-b text-center bg-amber-50/50">BASELINE</TableHead>
                
                {/* 12 Months Columns */}
                {monthlyHeaders.map((m) => (
                  <TableHead key={m.id} className="w-20 font-bold text-foreground border-b text-center bg-primary/5 uppercase text-[9px]">
                    {m.name.slice(0, 3)}
                  </TableHead>
                ))}

                <TableHead className="w-32 font-bold text-foreground border-b text-center">SATUAN</TableHead>
                <TableHead className="w-72 font-bold text-foreground border-b">PENJELASAN</TableHead>
                <TableHead className="w-48 font-bold text-foreground border-b">PIC</TableHead>
                <TableHead className="w-64 font-bold text-foreground border-b bg-primary/10">LINK DOKUMEN (ADMIN ONLY)</TableHead>
                <TableHead className="w-16 font-bold text-foreground border-b text-center">AKSI</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {programs.map((p, pIdx) => (
                <MisiGroup 
                  key={p.id} 
                  program={p} 
                  no={pIdx + 1}
                  selectedYear={selectedYear}
                  onUpdateIndikator={updateIndikator}
                  onUpdateValue={updateValue}
                  onDeleteIndikator={deleteIndikator}
                  onDeleteProgram={deleteProgram}
                  onAddIndikator={addIndikator}
                  onAddSasaran={addSasaran}
                />
              ))}
              
              {programs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={30} className="h-40 text-center text-muted-foreground">
                    Belum ada misi. Klik "Tambah Misi Baru" untuk memulai.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function MisiGroup({ 
  program, 
  no, 
  selectedYear,
  onUpdateIndikator,
  onUpdateValue,
  onDeleteIndikator,
  onDeleteProgram,
  onAddIndikator,
  onAddSasaran
}: { 
  program: Program, 
  no: number,
  selectedYear: Year,
  onUpdateIndikator: any,
  onUpdateValue: any,
  onDeleteIndikator: any,
  onDeleteProgram: any,
  onAddIndikator: any,
  onAddSasaran: any
}) {
  // Flatten indicators for this program
  const indicators = program.sasaran.flatMap(s => 
    s.indikator.map(i => ({ ...i, sasaranId: s.id, sasaranNama: s.nama }))
  );

  return (
    <>
      {/* Header Row for Program (Misi) */}
      <TableRow className="bg-primary/5 hover:bg-primary/10 transition-colors">
        <TableCell className="text-center font-bold border-b sticky left-0 bg-primary/5 z-20">
          {no}
        </TableCell>
        <TableCell colSpan={25} className="font-bold text-primary border-b sticky left-12 bg-primary/5 z-20 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-4 h-4" />
              <span>MISI: {program.nama}</span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-[10px] bg-background"
                onClick={() => {
                  const name = prompt("Nama Sasaran Baru untuk Misi ini:");
                  if (name) onAddSasaran(program.id, name);
                }}
              >
                <Plus className="w-3 h-3 mr-1" /> Tambah Sasaran
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] text-danger hover:bg-danger/10"
                onClick={() => {
                  if (confirm(`Hapus seluruh Program "${program.nama}" beserta semua data di dalamnya?`)) {
                    onDeleteProgram(program.id);
                  }
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" /> Hapus Misi
              </Button>
            </div>
          </div>
        </TableCell>
      </TableRow>

      {/* Details Rows */}
      {indicators.map((ind, iIdx) => (
        <TableRow key={ind.id} className="hover:bg-muted/30 transition-colors divide-x divide-border">
          <TableCell className="text-center text-[10px] text-muted-foreground border-b sticky left-0 bg-background z-10">
            {no}.{iIdx + 1}
          </TableCell>
          <TableCell className="border-b sticky left-12 bg-muted/5 z-10 max-w-[256px]">
             <div className="flex items-center gap-2">
                <ListTodo className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="truncate text-muted-foreground text-[10px]">{ind.sasaranNama}</span>
             </div>
          </TableCell>
          
          <TableCell className="p-0 border-b">
            <Input
              className="h-9 text-[10px] border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary/40 rounded-none px-2"
              defaultValue={ind.bagian}
              onBlur={(e) => onUpdateIndikator(ind.id, { bagian: e.target.value })}
            />
          </TableCell>
          
          <TableCell className="p-0 border-b">
            <Input
              className="h-9 text-[10px] border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary/40 rounded-none px-2"
              defaultValue={ind.borang_aipt}
              onBlur={(e) => onUpdateIndikator(ind.id, { borang_aipt: e.target.value })}
            />
          </TableCell>
          
          <TableCell className="p-0 border-b">
            <Input
              className="h-9 text-[10px] border-none bg-transparent text-center font-mono focus-visible:ring-1 focus-visible:ring-primary/40 rounded-none px-1"
              defaultValue={ind.kode}
              onBlur={(e) => onUpdateIndikator(ind.id, { kode: e.target.value })}
            />
          </TableCell>
          
          <TableCell className="p-0 border-b">
            <Input
              className="h-9 text-[10px] border-none bg-transparent font-semibold text-foreground focus-visible:ring-1 focus-visible:ring-primary/40 rounded-none px-3"
              defaultValue={ind.nama}
              onBlur={(e) => onUpdateIndikator(ind.id, { nama: e.target.value })}
            />
          </TableCell>
          
          <TableCell className="p-0 border-b text-center align-middle">
            <div className="flex items-center justify-center h-9 gap-1.5">
              <Checkbox 
                checked={ind.iku_ikt === "IKU"}
                onCheckedChange={(checked) => onUpdateIndikator(ind.id, { iku_ikt: checked ? "IKU" : "IKT" })}
                className="data-[state=checked]:bg-primary w-3.5 h-3.5"
              />
              <span className="text-[9px] font-bold text-muted-foreground w-6">{ind.iku_ikt || "IKT"}</span>
            </div>
          </TableCell>
          
          <TableCell className="p-0 border-b bg-amber-50/20">
            <Input
              type="number"
              className="h-9 text-[10px] border-none bg-transparent text-center font-mono focus-visible:ring-1 focus-visible:ring-primary/40 rounded-none px-1"
              defaultValue={ind.baseline}
              onBlur={(e) => onUpdateIndikator(ind.id, { baseline: Number(e.target.value) || 0 })}
            />
          </TableCell>

          {/* 12 Months Realization Data */}
          {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => {
            const val = ind.values[selectedYear];
            const displayValue = val?.months[m]?.actual || 0;
            return (
              <TableCell key={m} className="p-0 border-b bg-primary/5">
                <Input
                  type="number"
                  className="h-9 text-[10px] border-none bg-transparent text-center font-mono focus-visible:ring-1 focus-visible:ring-primary/40 rounded-none px-1"
                  defaultValue={displayValue}
                  onBlur={(e) => 
                    onUpdateValue(ind.id, selectedYear, "actual", Number(e.target.value) || 0, m)
                  }
                />
              </TableCell>
            );
          })}

          <TableCell className="p-0 border-b">
            <Input
              className="h-9 text-[10px] border-none bg-transparent text-center focus-visible:ring-1 focus-visible:ring-primary/40 rounded-none px-2"
              defaultValue={ind.satuan}
              onBlur={(e) => onUpdateIndikator(ind.id, { satuan: e.target.value })}
            />
          </TableCell>
          
          <TableCell className="p-0 border-b">
            <Input
              className="h-9 text-[10px] border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary/40 rounded-none px-2"
              defaultValue={ind.penjelasan}
              onBlur={(e) => onUpdateIndikator(ind.id, { penjelasan: e.target.value })}
            />
          </TableCell>
          
          <TableCell className="p-0 border-b">
            <Input
              className="h-9 text-[10px] border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary/40 rounded-none px-2"
              defaultValue={ind.pic}
              onBlur={(e) => onUpdateIndikator(ind.id, { pic: e.target.value })}
            />
          </TableCell>

          <TableCell className="p-0 border-b">
            <Input
              className="h-9 text-[10px] border-none bg-primary/5 focus-visible:ring-1 focus-visible:ring-primary/40 rounded-none px-2 font-medium text-primary"
              placeholder="https://..."
              defaultValue={ind.link}
              onBlur={(e) => onUpdateIndikator(ind.id, { link: e.target.value })}
            />
          </TableCell>

          <TableCell className="p-0 border-b text-center align-middle">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-danger hover:bg-danger/10"
              onClick={() => {
                if (confirm("Hapus baris detail ini?")) {
                  onDeleteIndikator("", "", ind.id);
                }
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </TableCell>
        </TableRow>
      ))}

      {/* Button to add indicator for this specific program */}
      <TableRow className="bg-muted/10">
        <TableCell colSpan={30} className="py-2 pl-12">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] h-7 text-primary hover:bg-primary/5"
            onClick={() => {
              if (program.sasaran.length === 0) {
                toast.error("Tambahkan Sasaran terlebih dahulu untuk misi ini.");
                return;
              }
              // Add to first sasaran by default for quick entry
              onAddIndikator("", program.sasaran[0].id, "Indikator Baru", "%");
              toast.success("Baris baru ditambahkan ke sasaran '" + program.sasaran[0].nama + "'");
            }}
          >
            <Plus className="w-3 h-3 mr-1" /> Tambah Baris Detail untuk Misi Ini
          </Button>
        </TableCell>
      </TableRow>
    </>
  );
}
