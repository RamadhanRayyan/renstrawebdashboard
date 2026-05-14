import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRenstra } from "@/hooks/use-renstra";
import { YEARS, MONTHS, type Year, capaian } from "@/lib/renstra-data";
import {
  Check,
  Search,
  PlusCircle,
  ArrowRight,
  Target as TargetIcon,
  ChevronRight,
  History,
  CheckCircle2,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMisiId?: string;
  initialIndikatorId?: string;
}

interface SessionLog {
  id: string;
  misi: string;
  indikator: string;
  bulan: string;
  nilai: number;
  timestamp: Date;
}

export function InputCapaianDialog({
  open,
  onOpenChange,
  initialMisiId,
  initialIndikatorId,
}: Props) {
  const { programs, updateValue, updateIndikator } = useRenstra();
  const [selectedMisi, setSelectedMisi] = useState<string>("");
  const [selectedIndikator, setSelectedIndikator] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<Year>(YEARS[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(new Date().getMonth() + 1)
  );
  const [value, setValue] = useState<string>("");
  const [linkValue, setLinkValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);

  // Selection states for comboboxes
  const [misiOpen, setMisiOpen] = useState(false);
  const [indOpen, setIndOpen] = useState(false);

  // Sync initial values
  useEffect(() => {
    if (initialMisiId) setSelectedMisi(initialMisiId);
    if (initialIndikatorId) setSelectedIndikator(initialIndikatorId);
  }, [initialMisiId, initialIndikatorId, open]);

  const selectedMisiData = useMemo(
    () => programs.find((p) => p.id === selectedMisi),
    [programs, selectedMisi]
  );

  const availableIndikators = useMemo(() => {
    if (!selectedMisiData) return [];
    return selectedMisiData.sasaran.flatMap((s) =>
      s.indikator.map((i) => ({ ...i, sasaranNama: s.nama }))
    );
  }, [selectedMisiData]);

  const selectedIndikatorData = useMemo(
    () => availableIndikators.find((i) => i.id === selectedIndikator),
    [availableIndikators, selectedIndikator]
  );

  const handleSave = async (addAnother = false) => {
    if (!selectedIndikator || !value) {
      toast.error("Mohon pilih indikator dan isi nilai capaian.");
      return;
    }

    setIsSubmitting(true);
    try {
      const numVal = Number(value);
      await updateValue(
        selectedIndikator,
        selectedYear,
        "actual",
        numVal,
        Number(selectedMonth)
      );

      if (linkValue) {
        await updateIndikator(selectedIndikator, { link: linkValue });
      }

      // Add to session log
      const newLog: SessionLog = {
        id: Math.random().toString(36).substr(2, 9),
        misi: selectedMisiData?.nama || "",
        indikator: selectedIndikatorData?.nama || "",
        bulan: MONTHS.find((m) => String(m.id) === selectedMonth)?.name || "",
        nilai: numVal,
        timestamp: new Date(),
      };
      setSessionLogs((prev) => [newLog, ...prev].slice(0, 5));

      toast.success("Capaian berhasil disimpan!");
      setValue("");
      setLinkValue("");

      if (!addAnother) {
        onOpenChange(false);
      } else {
        // Just reset indikator to allow another entry for same misi
        setSelectedIndikator("");
        // Focus will naturally go back to indikator select if we wanted
      }
    } catch (err) {
      toast.error("Gagal menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const step = !selectedMisi ? 1 : !selectedIndikator ? 2 : 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-[1.5rem] bg-white">
        <div className="bg-white flex-1 overflow-y-auto">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 sm:p-10 text-white shrink-0">
            <DialogHeader className="mb-0">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <PlusCircle className="h-7 w-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight text-white">
                    Input Capaian
                  </DialogTitle>
                  <DialogDescription className="font-bold text-emerald-100/80">
                    Lengkapi form untuk memperbarui data monitoring.
                  </DialogDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-6">
                 {[1, 2, 3].map((s) => (
                   <div key={s} className="flex-1 flex items-center gap-2">
                      <div className={cn(
                        "h-1.5 flex-1 rounded-full transition-all duration-500",
                        step >= s ? "bg-white" : "bg-white/20"
                      )} />
                   </div>
                 ))}
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
              {/* Step 1: Misi */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Step 1: Pilih Misi Strategis
                </Label>
                <Popover open={misiOpen} onOpenChange={setMisiOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between h-14 px-5 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-700 shadow-sm font-bold text-slate-700",
                        !selectedMisi && "text-slate-400 font-medium"
                      )}
                    >
                      <span className="truncate">
                        {selectedMisi
                          ? programs.find((p) => p.id === selectedMisi)?.nama
                          : "Pilih Misi..."}
                      </span>
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[calc(100vw-64px)] sm:w-[536px] p-0 rounded-2xl border-none shadow-2xl overflow-hidden">
                    <Command>
                      <CommandInput placeholder="Cari misi..." className="h-14 border-none ring-0 focus:ring-0 px-4" />
                      <CommandList>
                        <CommandEmpty>Misi tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {programs.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.nama}
                              onSelect={() => {
                                setSelectedMisi(p.id);
                                setSelectedIndikator("");
                                setMisiOpen(false);
                              }}
                              className="py-3 px-4 aria-selected:bg-primary/5"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 text-primary",
                                  selectedMisi === p.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <span className="font-bold text-slate-700">{p.nama}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Step 2: Indikator (Only if misi selected) */}
              {selectedMisi && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Step 2: Pilih Indikator Kinerja
                  </Label>
                  <Popover open={indOpen} onOpenChange={setIndOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between h-14 px-5 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-700 shadow-sm font-bold text-slate-700",
                          !selectedIndikator && "text-slate-400 font-medium"
                        )}
                      >
                        <span className="truncate">
                          {selectedIndikator
                            ? availableIndikators.find(
                                (i) => i.id === selectedIndikator
                              )?.nama
                            : "Pilih Indikator..."}
                        </span>
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[calc(100vw-64px)] sm:w-[536px] p-0 rounded-2xl border-none shadow-2xl overflow-hidden">
                      <Command>
                        <CommandInput placeholder="Cari indikator..." className="h-12 border-none" />
                        <CommandList>
                          <CommandEmpty>Indikator tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {availableIndikators.map((i) => (
                              <CommandItem
                                key={i.id}
                                value={i.nama}
                                onSelect={() => {
                                  setSelectedIndikator(i.id);
                                  setIndOpen(false);
                                }}
                                className="py-3 px-4 aria-selected:bg-primary/5"
                              >
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-700">{i.nama}</span>
                                  <span className="text-[10px] text-slate-400 uppercase font-black">
                                    Sasaran: {i.sasaranNama}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Indikator Context Info */}
                  {selectedIndikatorData && (
                    <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <TargetIcon className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Target {selectedYear}</p>
                            <p className="font-black text-slate-800 text-sm">
                               {selectedIndikatorData.values[selectedYear]?.target || 0} {selectedIndikatorData.satuan}
                            </p>
                         </div>
                      </div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3 py-1 rounded-xl">
                         {selectedIndikatorData.iku_ikt}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Value & Time (Only if ind selected) */}
              {selectedIndikator && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Bulan Capaian
                    </Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="h-14 px-5 rounded-2xl border-none bg-white shadow-sm font-bold text-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {MONTHS.filter((m) => m.id !== 0).map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Nilai Capaian ({selectedIndikatorData?.satuan})
                    </Label>
                    <div className="relative">
                        <Input
                          type="number"
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          placeholder="0.0"
                          className="h-14 px-5 pr-14 rounded-2xl border border-emerald-200 bg-white shadow-sm font-black text-lg text-emerald-600 placeholder:text-emerald-100 focus-visible:ring-emerald-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          autoFocus
                        />
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-300 text-xs uppercase">
                          {selectedIndikatorData?.satuan}
                       </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Link Dokumen Bukti (Opsional)
                    </Label>
                    <Input
                      type="url"
                      value={linkValue}
                      onChange={(e) => setLinkValue(e.target.value)}
                      placeholder="https://gdrive..."
                      className="h-14 px-5 rounded-2xl border-none bg-white shadow-sm font-medium text-slate-700 placeholder:text-slate-300"
                    />
                  </div>
                </div>
              )}
          </div>

          {/* Session Logs - "Perfect" UX Touch */}
          {sessionLogs.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200">
               <div className="flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Update Terakhir di Sesi Ini</span>
               </div>
               <div className="space-y-3">
                  {sessionLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between bg-white/40 p-3 rounded-xl border border-white">
                       <div className="flex items-center gap-3 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                             <p className="text-xs font-bold text-slate-700 truncate">{log.indikator}</p>
                             <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tight">{log.bulan} • {log.nilai}</p>
                          </div>
                       </div>
                       <div className="text-[9px] font-bold text-slate-300">
                          {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          <DialogFooter className="mt-10 flex-col sm:flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
                setValue("");
                setLinkValue("");
              }}
              className="rounded-2xl h-14 font-bold text-slate-500 hover:bg-slate-100 px-6"
            >
              Batal
            </Button>
            <div className="flex gap-3 flex-1 sm:flex-none">
              <Button
                variant="outline"
                disabled={!selectedIndikator || !value || isSubmitting}
                onClick={() => handleSave(true)}
                className="flex-1 sm:flex-none h-14 px-6 rounded-2xl font-bold border-2 border-primary/20 text-primary hover:bg-primary/5 gap-2"
              >
                Simpan & Lanjut
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                disabled={!selectedIndikator || !value || isSubmitting}
                onClick={() => handleSave(false)}
                className="flex-1 sm:flex-none h-14 px-10 rounded-2xl font-black bg-primary text-white shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all gap-2"
              >
                {isSubmitting ? "Menyimpan..." : "Selesai"}
                {!isSubmitting && <ArrowRight className="h-5 w-5" />}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
