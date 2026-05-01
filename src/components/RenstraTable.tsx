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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  YEARS,
  MONTHS,
  capaian,
  getStatus,
  type Year,
} from "@/lib/renstra-data";
import { useRenstra } from "@/hooks/use-renstra";
import {
  Download,
  RotateCcw,
  LayoutGrid,
  ListTodo,
  TrendingUp
} from "lucide-react";

export function RenstraTable({ isGuest = false }: { isGuest?: boolean }) {
  const {
    programs,
    reset,
  } = useRenstra();

  const [selectedYear, setSelectedYear] = useState<Year>(YEARS[0]);
  
  const monthlyHeaders = MONTHS.filter(m => m.id !== 0);

  const exportExcel = () => {
    const rows: Record<string, string | number>[] = [];
    programs.forEach((p) => {
      p.sasaran.forEach((s) => {
        s.indikator.forEach((ind) => {
          const row: Record<string, string | number> = {
            "No Misi": p.nama,
            "Sasaran": s.nama,
            "Indikator": ind.nama,
            "Bagian": ind.bagian || "",
            "Kode": ind.kode || "",
            "IKU/IKT": ind.iku_ikt || "",
            "Baseline": ind.baseline || 0,
            "Satuan": ind.satuan,
          };
          if (!isGuest) {
            row["Link Dokumen"] = ind.link || "";
          }
          monthlyHeaders.forEach(m => {
            row[m.name] = ind.values[selectedYear]?.months[m.id]?.actual || 0;
          });
          rows.push(row);
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Renstra Bulanan");
    XLSX.writeFile(wb, `renstra-monitoring-${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <Card className="shadow-elegant border bg-background/50 backdrop-blur-md">
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">
                  Pilih Tahun Monitoring
                </span>
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
            
            <div className="flex items-center gap-2">
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
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="shadow-card overflow-hidden border">
        <div className="overflow-x-auto">
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
                
                {monthlyHeaders.map((m) => (
                  <TableHead key={m.id} className="w-24 font-bold text-foreground border-b text-center bg-primary/5 uppercase text-[9px]">
                    {m.name}
                  </TableHead>
                ))}

                <TableHead className="w-24 font-bold text-foreground border-b text-center">SATUAN</TableHead>
                <TableHead className="w-64 font-bold text-foreground border-b">PENJELASAN</TableHead>
                <TableHead className="w-40 font-bold text-foreground border-b">PIC</TableHead>
                {!isGuest && <TableHead className="w-48 font-bold text-foreground border-b bg-primary/10">LINK DOKUMEN</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {programs.map((p, pIdx) => (
                <MonitoringGroup 
                  key={p.id} 
                  program={p} 
                  no={pIdx + 1}
                  selectedYear={selectedYear}
                  isGuest={isGuest}
                />
              ))}
              
              {programs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={30} className="h-40 text-center text-muted-foreground">
                    Data tidak ditemukan.
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

function MonitoringGroup({ program, no, selectedYear, isGuest }: { program: any, no: number, selectedYear: Year, isGuest: boolean }) {
  const indicators = program.sasaran.flatMap((s: any) => 
    s.indikator.map((i: any) => ({ ...i, sasaranNama: s.nama }))
  );

  return (
    <>
      <TableRow className="bg-primary/5">
        <TableCell className="text-center font-bold border-b sticky left-0 bg-primary/5 z-20">{no}</TableCell>
        <TableCell colSpan={25} className="font-bold text-primary border-b sticky left-12 bg-primary/5 z-20 py-3">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            MISI: {program.nama}
          </div>
        </TableCell>
      </TableRow>

      {indicators.map((ind: any, iIdx: number) => (
        <TableRow key={ind.id} className="hover:bg-muted/30 transition-colors divide-x divide-border">
          <TableCell className="text-center text-muted-foreground border-b sticky left-0 bg-background z-10">
            {no}.{iIdx + 1}
          </TableCell>
          <TableCell className="border-b sticky left-12 bg-muted/5 z-10 max-w-[256px]">
            <div className="flex items-center gap-2">
              <ListTodo className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="truncate text-muted-foreground text-[10px]">{ind.sasaranNama}</span>
            </div>
          </TableCell>
          
          <TableCell className="border-b px-2">{ind.bagian || "—"}</TableCell>
          <TableCell className="border-b px-2">{ind.borang_aipt || "—"}</TableCell>
          <TableCell className="border-b text-center font-mono">{ind.kode || "—"}</TableCell>
          <TableCell className="border-b px-3 font-medium text-foreground">{ind.nama}</TableCell>
          <TableCell className="border-b text-center">
            {ind.iku_ikt ? (
              <Badge variant="outline" className="text-[9px] font-bold py-0 h-4 bg-primary/10 text-primary border-primary/20">
                {ind.iku_ikt}
              </Badge>
            ) : "—"}
          </TableCell>
          <TableCell className="border-b text-center bg-amber-50/20 font-mono">{ind.baseline || 0}</TableCell>

          {/* 12 Months Data */}
          {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => {
            const val = ind.values[selectedYear]?.months[m]?.actual || 0;
            return (
              <TableCell key={m} className="border-b text-center bg-primary/5 font-mono">
                {val || "—"}
              </TableCell>
            );
          })}

          <TableCell className="border-b text-center font-medium">{ind.satuan}</TableCell>
          <TableCell className="border-b px-2 text-muted-foreground line-clamp-1 max-w-[200px]" title={ind.penjelasan}>
            {ind.penjelasan || "—"}
          </TableCell>
          <TableCell className="border-b px-2 italic text-muted-foreground">{ind.pic || "—"}</TableCell>
          {!isGuest && (
            <TableCell className="border-b px-2 font-medium text-primary bg-primary/5 truncate max-w-[150px]">
              {ind.link ? (
                <a href={ind.link} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Buka Link
                </a>
              ) : (
                "—"
              )}
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  );
}
