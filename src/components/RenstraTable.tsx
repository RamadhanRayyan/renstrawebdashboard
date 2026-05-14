import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { YEARS, type Year, type Program, capaian } from "@/lib/renstra-data";
import { useRenstra } from "@/hooks/use-renstra";
import {
  Download,
  RotateCcw,
  LayoutGrid,
  ListTodo,
  TrendingUp,
  PencilLine,
  Search,
  Target as TargetIcon,
  Activity
} from "lucide-react";
import { InputCapaianDialog } from "./InputCapaianDialog";
import { RenstraFetchAlert } from "./RenstraFetchAlert";

export function RenstraTable({ isGuest = false }: { isGuest?: boolean }) {
  const {
    programs,
    reset,
    isError,
    error,
    refetchRenstra,
  } = useRenstra();

  const [selectedYear, setSelectedYear] = useState<Year>(YEARS[0]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [quickInputState, setQuickInputState] = useState<{
    open: boolean;
    misiId: string;
    indikatorId: string;
  }>({
    open: false,
    misiId: "",
    indikatorId: ""
  });

  const filteredPrograms = useMemo(() => {
    if (!searchTerm) return programs;
    
    return programs.map(p => ({
      ...p,
      sasaran: p.sasaran.map(s => ({
        ...s,
        indikator: s.indikator.filter(i => 
          i.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.nama.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(s => s.indikator.length > 0)
    })).filter(p => p.sasaran.length > 0);
  }, [programs, searchTerm]);

  const exportExcel = async () => {
    // Basic export implementation could go here, or we can use the same logic if really needed.
    // For now we'll keep it simple to export CSV or similar.
    const rows: any[] = [];
    programs.forEach((p) => {
      p.sasaran.forEach((s) => {
        s.indikator.forEach((ind) => {
          rows.push({
            "Misi": p.nama,
            "Sasaran": s.nama,
            "Indikator": ind.nama,
            "Target": ind.values[selectedYear]?.target || 0,
            "Realisasi": ind.values[selectedYear]?.actual || 0,
            "Satuan": ind.satuan
          });
        });
      });
    });
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Capaian");
    XLSX.writeFile(wb, `capaian-renstra-${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {isError && <RenstraFetchAlert error={error} onRetry={refetchRenstra} />}

      {/* Filters */}
      <Card className="shadow-sm border bg-card rounded-2xl">
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-4 flex-wrap flex-1">
              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block ml-1">
                  Cari Indikator / Sasaran
                </span>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Ketik nama indikator..." 
                    className="pl-9 h-10 bg-background shadow-sm rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block ml-1">
                  Tahun
                </span>
                <Select
                  value={String(selectedYear)}
                  onValueChange={(v) => setSelectedYear(Number(v) as Year)}
                >
                  <SelectTrigger className="w-24 h-10 bg-background shadow-sm font-semibold rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => {setSearchTerm(""); reset();}} className="h-10 px-4 bg-background shadow-sm hover:bg-muted rounded-xl">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button size="sm" onClick={exportExcel} className="h-10 px-4 shadow-md bg-primary text-primary-foreground rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content List */}
      <div className="space-y-6">
        {filteredPrograms.map((p, pIdx) => (
          <Card key={p.id} className="border shadow-sm bg-card rounded-2xl overflow-hidden">
            <div className="bg-primary/5 px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Misi {pIdx + 1}</p>
                  <h3 className="font-bold text-lg text-foreground">{p.nama}</h3>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="space-y-6">
                {p.sasaran.map((s) => (
                  <div key={s.id} className="border rounded-2xl bg-muted/20 overflow-hidden">
                    <div className="px-5 py-3 border-b bg-background/50 flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-primary" />
                      <span className="font-bold text-sm text-foreground">{s.nama}</span>
                    </div>

                    <div className="p-4 grid gap-4">
                      {s.indikator.map(ind => {
                        const val = ind.values[selectedYear];
                        const target = val?.target || 0;
                        const actual = val?.actual || 0;
                        const progress = target > 0 ? Math.min(capaian(actual, target), 100) : 0;
                        const overachieve = target > 0 && actual > target;

                        return (
                          <div key={ind.id} className="bg-card border rounded-xl p-5 shadow-sm hover:border-primary/40 transition-colors flex flex-col md:flex-row justify-between gap-6 group">
                            
                            <div className="flex-1">
                              <div className="flex items-start gap-3 mb-3">
                                <TargetIcon className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                <div>
                                  <h4 className="font-semibold text-[15px] leading-tight text-foreground">{ind.nama}</h4>
                                  <p className="text-xs text-muted-foreground mt-1">PIC: <span className="font-medium text-foreground">{ind.pic || '-'}</span> | Bagian: <span className="font-medium text-foreground">{ind.bagian || '-'}</span></p>
                                </div>
                              </div>
                              
                              <div className="pl-8">
                                <div className="flex justify-between text-xs font-bold mb-1.5">
                                  <span>Capaian: {actual} / {target} {ind.satuan}</span>
                                  <span className={progress >= 100 ? "text-emerald-600" : progress >= 50 ? "text-amber-600" : "text-rose-600"}>
                                    {progress.toFixed(1)}% {overachieve && "(Melampaui)"}
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden">
                                  <div 
                                    style={{ width: `${progress}%` }}
                                    className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex md:flex-col items-center md:items-end justify-center md:justify-start gap-3 md:w-48 shrink-0 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4 border-dashed">
                              {!isGuest && (
                                <Button 
                                  className="w-full rounded-xl shadow-sm bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border-none" 
                                  onClick={() => setQuickInputState({ open: true, misiId: p.id, indikatorId: ind.id })}
                                >
                                  <PencilLine className="w-4 h-4 mr-2" /> Input Capaian
                                </Button>
                              )}
                              
                              {ind.link && !isGuest && (
                                <Button variant="outline" className="w-full rounded-xl text-xs" asChild>
                                  <a href={ind.link} target="_blank" rel="noopener noreferrer">
                                    <TrendingUp className="w-3 h-3 mr-2" /> Bukti Dokumen
                                  </a>
                                </Button>
                              )}
                              
                              <div className="text-center w-full mt-auto">
                                <Badge variant="secondary" className="text-[10px] bg-background/50 text-muted-foreground border-none">
                                  {ind.kode ? `Kode: ${ind.kode}` : 'IKU/IKT: ' + (ind.iku_ikt || '-')}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPrograms.length === 0 && (
          <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-2xl bg-card">
            <Activity className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold">Data Tidak Ditemukan</h3>
            <p className="mt-1">Tidak ada misi atau indikator yang cocok dengan pencarian Anda.</p>
          </div>
        )}
      </div>

      <InputCapaianDialog 
        open={quickInputState.open}
        onOpenChange={(open) => setQuickInputState(prev => ({ ...prev, open }))}
        initialMisiId={quickInputState.misiId}
        initialIndikatorId={quickInputState.indikatorId}
      />
    </div>
  );
}

