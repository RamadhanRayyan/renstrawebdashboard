import { useMemo, useState, memo, useCallback } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RenstraFetchAlert } from "./RenstraFetchAlert";

export function RenstraInputTable() {
  const {
    programs,
    updateValue,
    updateIndikator,
    addIndikator,
    deleteIndikator,
    addProgram,
    deleteProgram,
    addSasaranRow,
    updateSasaran,
    isError,
    error,
    refetchRenstra,
  } = useRenstra();
  
  const [selectedYear, setSelectedYear] = useState<Year>(YEARS[0]);

  // Dialog states (only visibility and identifiers, names moved into dialog components)
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false);
  const [isDeleteProgramOpen, setIsDeleteProgramOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<{id: string, nama: string} | null>(null);

  const [isDeleteIndikatorOpen, setIsDeleteIndikatorOpen] = useState(false);
  const [indikatorToDelete, setIndikatorToDelete] = useState<string | null>(null);

  const [isAddSasaranFullOpen, setIsAddSasaranFullOpen] = useState(false);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);

  const monthlyHeaders = MONTHS.filter(m => m.id !== 0);

  // Stable callbacks


  const onConfirmDeleteProgram = useCallback((id: string, nama: string) => {
    setProgramToDelete({id, nama});
    setIsDeleteProgramOpen(true);
  }, []);

  const onConfirmDeleteIndikator = useCallback((id: string) => {
    setIndikatorToDelete(id);
    setIsDeleteIndikatorOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      {isError && <RenstraFetchAlert error={error} onRetry={refetchRenstra} />}

      {/* Control Panel */}
      <Card className="p-4 border bg-background shadow-sm">
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
            onClick={() => setIsAddProgramOpen(true)}
            className="shadow-elegant"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Misi Baru
          </Button>
        </div>
      </Card>

      {/* Spreadsheet Table */}
      <Card className="shadow-elegant overflow-hidden border bg-background">
        <div className="overflow-x-auto max-h-[75vh] scrollbar-thin scrollbar-thumb-primary/20">
          <Table className="min-w-[2800px] text-[11px] border-separate border-spacing-0">
            <TableHeader className="sticky top-0 bg-secondary z-30 shadow-sm">
              <TableRow className="divide-x divide-border">
                <TableHead className="w-12 text-center font-bold text-foreground border-b sticky left-0 bg-secondary z-40">No</TableHead>
                <TableHead className="w-64 font-bold text-foreground border-b sticky left-12 bg-secondary z-40">Misi (Program)</TableHead>
                <TableHead className="w-48 font-bold text-foreground border-b">BAGIAN</TableHead>
                <TableHead className="w-48 font-bold text-foreground border-b">Borang Akreditasi AIPT</TableHead>
                <TableHead className="w-24 font-bold text-foreground border-b text-center">KODE</TableHead>
                <TableHead className="w-[400px] font-bold text-foreground border-b">INDIKATOR KINERJA RENSTRA</TableHead>
                <TableHead className="w-24 font-bold text-foreground border-b text-center">IKU/IKT</TableHead>
                <TableHead className="w-24 font-bold text-foreground border-b text-center bg-amber-50/50">BASELINE</TableHead>
                <TableHead className="w-32 font-bold text-foreground border-b text-center bg-indigo-50/50">TARGET {selectedYear}</TableHead>
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
                  onAddSasaranRow={(pid) => {
                    setActiveProgramId(pid);
                    setIsAddSasaranFullOpen(true);
                  }}
                  onUpdateSasaran={updateSasaran}
                  confirmDeleteProgram={onConfirmDeleteProgram}
                  confirmDeleteIndikator={onConfirmDeleteIndikator}
                />
              ))}
              
              {!isError && programs.length === 0 && (
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

      {/* Optimized Dialogs */}
      <AddProgramDialog 
        open={isAddProgramOpen} 
        onOpenChange={setIsAddProgramOpen} 
        onAdd={addProgram} 
      />

      <AddSasaranFullDialog
        open={isAddSasaranFullOpen}
        onOpenChange={setIsAddSasaranFullOpen}
        onAdd={addSasaranRow}
        programId={activeProgramId}
        selectedYear={selectedYear}
      />

      <DeleteProgramDialog 
        open={isDeleteProgramOpen} 
        onOpenChange={setIsDeleteProgramOpen}
        program={programToDelete}
        onDelete={deleteProgram}
      />

      <DeleteIndikatorDialog 
        open={isDeleteIndikatorOpen} 
        onOpenChange={setIsDeleteIndikatorOpen}
        indikatorId={indikatorToDelete}
        onDelete={deleteIndikator}
      />
    </div>
  );
}

// Dialog Components to isolate state and prevent main table rerenders
function AddProgramDialog({ open, onOpenChange, onAdd }: { open: boolean, onOpenChange: (o: boolean) => void, onAdd: (n: string) => void }) {
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if(!o) setName(""); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Tambah Misi Baru</DialogTitle><DialogDescription>Masukkan nama misi strategis baru.</DialogDescription></DialogHeader>
        <div className="py-4"><Label htmlFor="prog-name">Nama Misi</Label><Input id="prog-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus className="mt-2" /></div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button><Button onClick={() => { if(name.trim()){ onAdd(name.trim()); onOpenChange(false); setName(""); } }}>Simpan</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



function DeleteProgramDialog({ open, onOpenChange, program, onDelete }: { open: boolean, onOpenChange: (o: boolean) => void, program: {id: string, nama: string} | null, onDelete: (id: string) => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Hapus Misi?</AlertDialogTitle><AlertDialogDescription>Hapus Program <strong>"{program?.nama}"</strong> beserta semua datanya?</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={(e) => { 
              e.preventDefault(); 
              if(program){ 
                onDelete(program.id); 
                onOpenChange(false); 
              } 
            }}
          >
            Hapus Permanen
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteIndikatorDialog({ open, onOpenChange, indikatorId, onDelete }: { open: boolean, onOpenChange: (o: boolean) => void, indikatorId: string | null, onDelete: (p:string, s:string, id: string) => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Hapus Baris?</AlertDialogTitle><AlertDialogDescription>Apakah Anda yakin ingin menghapus baris indikator ini?</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={(e) => { 
              e.preventDefault(); 
              if(indikatorId){ 
                onDelete("", "", indikatorId); 
                onOpenChange(false); 
              } 
            }}
          >
            Hapus
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AddSasaranFullDialog({ 
  open, 
  onOpenChange, 
  onAdd, 
  programId,
  selectedYear
}: { 
  open: boolean, 
  onOpenChange: (o: boolean) => void, 
  onAdd: (payload: any) => void,
  programId: string | null,
  selectedYear: number
}) {
  const [formData, setFormData] = useState({
    sasaranNama: "",
    indikatorNama: "",
    bagian: "",
    borang_aipt: "",
    kode: "",
    iku_ikt: "",
    baseline: 0,
    satuan: "",
    penjelasan: "",
    pic: "",
    link: "",
    targetTahunan: 0
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Removed handleMonthChange as it's no longer needed

  const handleSubmit = () => {
    if (programId && formData.sasaranNama.trim() && formData.indikatorNama.trim()) {
      onAdd({
        programId,
        ...formData,
        selectedYear
      });
      onOpenChange(false);
      setFormData({ sasaranNama: "", indikatorNama: "", bagian: "", borang_aipt: "", kode: "", iku_ikt: "", baseline: 0, satuan: "", penjelasan: "", pic: "", link: "", targetTahunan: 0 });
    } else {
      toast.error("Misi (Program) dan Indikator Kinerja wajib diisi!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if(!o) setFormData({ sasaranNama: "", indikatorNama: "", bagian: "", borang_aipt: "", kode: "", iku_ikt: "", baseline: 0, satuan: "", penjelasan: "", pic: "", link: "", targetTahunan: 0 }); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Sasaran & Indikator Baru</DialogTitle>
          <DialogDescription>Isi semua data sasaran di bawah ini. Setelah dibuat, Anda dapat mengeditnya langsung di tabel.</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 text-sm">
          <div className="space-y-2">
            <Label>Misi (Program)</Label>
            <Input value={formData.sasaranNama} onChange={(e) => handleChange("sasaranNama", e.target.value)} placeholder="Contoh: Meningkatnya kualitas..." />
          </div>
          <div className="space-y-2">
            <Label>Indikator Kinerja Renstra</Label>
            <Input value={formData.indikatorNama} onChange={(e) => handleChange("indikatorNama", e.target.value)} placeholder="Indikator..." />
          </div>
          
          <div className="space-y-2">
            <Label>Bagian</Label>
            <Input value={formData.bagian} onChange={(e) => handleChange("bagian", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Borang Akreditasi AIPT</Label>
            <Input value={formData.borang_aipt} onChange={(e) => handleChange("borang_aipt", e.target.value)} />
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label>Kode</Label>
              <Input value={formData.kode} onChange={(e) => handleChange("kode", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>IKU/IKT</Label>
              <Input value={formData.iku_ikt} onChange={(e) => handleChange("iku_ikt", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Baseline</Label>
              <Input type="number" value={formData.baseline} onChange={(e) => handleChange("baseline", Number(e.target.value) || 0)} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Satuan</Label>
              <Input value={formData.satuan} onChange={(e) => handleChange("satuan", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>PIC</Label>
              <Input value={formData.pic} onChange={(e) => handleChange("pic", e.target.value)} />
            </div>
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label>Penjelasan</Label>
            <Input value={formData.penjelasan} onChange={(e) => handleChange("penjelasan", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Link Dokumen</Label>
            <Input value={formData.link} onChange={(e) => handleChange("link", e.target.value)} placeholder="https://..." />
          </div>
          
          <div className="space-y-2 md:col-span-2 pt-4 border-t">
            <Label className="block mb-2">Target Tahunan ({selectedYear})</Label>
            <Input type="number" className="h-10 font-bold max-w-xs" value={formData.targetTahunan || ""} onChange={(e) => handleChange("targetTahunan", Number(e.target.value) || 0)} placeholder="Masukkan Target..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSubmit}>Simpan Sasaran</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Memoized MisiGroup to prevent unnecessary rerenders
const MisiGroup = memo(function MisiGroup({ 
  program, 
  no, 
  selectedYear,
  onUpdateIndikator,
  onUpdateValue,
  onDeleteIndikator,
  onDeleteProgram,
  onAddIndikator,
  onAddSasaranRow,
  onUpdateSasaran,
  confirmDeleteProgram,
  confirmDeleteIndikator
}: { 
  program: Program, 
  no: number,
  selectedYear: Year,
  onUpdateIndikator: any,
  onUpdateValue: any,
  onDeleteIndikator: any,
  onDeleteProgram: any,
  onAddIndikator: any,
  onAddSasaranRow: (id: string) => void,
  onUpdateSasaran: (id: string, nama: string) => void,
  confirmDeleteProgram: (id: string, nama: string) => void,
  confirmDeleteIndikator: (id: string) => void
}) {
  const indicators = program.sasaran.flatMap(s => 
    s.indikator.map(i => ({ ...i, sasaranId: s.id, sasaranNama: s.nama }))
  );

  return (
    <>
      <TableRow className="bg-primary/5 hover:bg-primary/10 transition-colors">
        <TableCell className="text-center font-bold border-b sticky left-0 bg-primary/5 z-20">{no}</TableCell>
        <TableCell colSpan={25} className="font-bold text-primary border-b py-3">
          <div className="flex items-center gap-4" style={{ width: 'max-content' }}>
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-4 h-4" />
              <span>MISI: {program.nama}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-[10px] bg-background" onClick={() => onAddSasaranRow(program.id)}>
                <Plus className="w-3 h-3 mr-1" /> Tambah Sasaran
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] text-destructive hover:bg-destructive/10" onClick={() => confirmDeleteProgram(program.id, program.nama)}>
                <Trash2 className="w-3 h-3 mr-1" /> Hapus Misi
              </Button>
            </div>
          </div>
        </TableCell>
      </TableRow>

      {indicators.map((ind, iIdx) => (
        <TableRow key={ind.id} className="hover:bg-muted/30 transition-colors divide-x divide-border">
          <TableCell className="text-center text-[10px] text-muted-foreground border-b sticky left-0 bg-background z-10">{no}.{iIdx + 1}</TableCell>
          <TableCell className="p-0 border-b sticky left-12 bg-muted/5 z-10 max-w-[256px]">
            <div className="flex items-center gap-2 pl-2">
              <ListTodo className="w-3 h-3 text-muted-foreground shrink-0" />
              <Input className="h-9 text-[10px] border-none bg-transparent px-2 w-full" defaultValue={ind.sasaranNama} onBlur={(e) => onUpdateSasaran(ind.sasaranId, e.target.value)} placeholder="Nama Sasaran..." />
            </div>
          </TableCell>
          <TableCell className="p-0 border-b"><Input className="h-9 text-[10px] border-none bg-transparent px-2" defaultValue={ind.bagian} onBlur={(e) => onUpdateIndikator(ind.id, { bagian: e.target.value })} /></TableCell>
          <TableCell className="p-0 border-b"><Input className="h-9 text-[10px] border-none bg-transparent px-2" defaultValue={ind.borang_aipt} onBlur={(e) => onUpdateIndikator(ind.id, { borang_aipt: e.target.value })} /></TableCell>
          <TableCell className="p-0 border-b"><Input className="h-9 text-[10px] border-none bg-transparent text-center font-mono px-1" defaultValue={ind.kode} onBlur={(e) => onUpdateIndikator(ind.id, { kode: e.target.value })} /></TableCell>
          <TableCell className="p-0 border-b"><Input className="h-9 text-[10px] border-none bg-transparent font-semibold px-3" defaultValue={ind.nama} onBlur={(e) => onUpdateIndikator(ind.id, { nama: e.target.value })} /></TableCell>
          <TableCell className="p-0 border-b text-center align-middle">
            <Input className="h-9 text-[10px] border-none bg-transparent text-center font-bold px-1" defaultValue={ind.iku_ikt} onBlur={(e) => onUpdateIndikator(ind.id, { iku_ikt: e.target.value })} placeholder="IKU/IKT" />
          </TableCell>
          <TableCell className="p-0 border-b bg-amber-50/20"><Input type="number" className="h-9 text-[10px] border-none bg-transparent text-center font-mono px-1" defaultValue={ind.baseline} onBlur={(e) => onUpdateIndikator(ind.id, { baseline: Number(e.target.value) || 0 })} /></TableCell>
          <TableCell className="p-0 border-b bg-indigo-50/20">
             <Input type="number" className="h-9 text-[10px] border-none bg-transparent text-center font-bold px-1 text-indigo-700" defaultValue={ind.values[selectedYear]?.target || 0} onBlur={(e) => onUpdateValue(ind.id, selectedYear, "target", Number(e.target.value) || 0, 0)} />
          </TableCell>
          <TableCell className="p-0 border-b"><Input className="h-9 text-[10px] border-none bg-transparent text-center px-2" defaultValue={ind.satuan} onBlur={(e) => onUpdateIndikator(ind.id, { satuan: e.target.value })} /></TableCell>
          <TableCell className="p-0 border-b"><Input className="h-9 text-[10px] border-none bg-transparent px-2" defaultValue={ind.penjelasan} onBlur={(e) => onUpdateIndikator(ind.id, { penjelasan: e.target.value })} /></TableCell>
          <TableCell className="p-0 border-b"><Input className="h-9 text-[10px] border-none bg-transparent px-2" defaultValue={ind.pic} onBlur={(e) => onUpdateIndikator(ind.id, { pic: e.target.value })} /></TableCell>
          <TableCell className="p-0 border-b"><Input className="h-9 text-[10px] border-none bg-primary/5 px-2 font-medium text-primary" placeholder="https://..." defaultValue={ind.link} onBlur={(e) => onUpdateIndikator(ind.id, { link: e.target.value })} /></TableCell>
          <TableCell className="p-0 border-b text-center align-middle">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-danger hover:bg-danger/10" onClick={() => confirmDeleteIndikator(ind.id)}><Trash2 className="h-3 w-3" /></Button>
          </TableCell>
        </TableRow>
      ))}


    </>
  );
});
