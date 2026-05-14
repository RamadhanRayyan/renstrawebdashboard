import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRenstra } from "@/hooks/use-renstra";
import { YEARS } from "@/lib/renstra-data";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ImportRenstraDialog() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const { refetchRenstra } = useRenstra();

  const handleImport = async () => {
    if (!text.trim()) {
      toast.error("Data tidak boleh kosong");
      return;
    }

    setIsImporting(true);
    try {
      // Parse TSV (Tab Separated Values) - default for Excel/Google Sheets paste
      // Note: This is a simple parser, might need adjustment if cells contain tabs
      const rows = text.split('\n').map(row => row.split('\t'));
      
      // Expected Columns A-Q (0-16):
      // 0: No, 1: Misi, 2: BAGIAN, 3: Borang Akreditasi AIPT, 4: (Merge empty), 5: KODE, 
      // 6: INDIKATOR KINERJA RENSTRA, 7: IKU/IKT, 8: BASELINE, 
      // 9: 2026, 10: 2027, 11: 2028, 12: 2029, 13: 2030, 
      // 14: SATUAN, 15: PENJELASAN, 16: PIC
      
      let programsMap = new Map();
      let sasaransMap = new Map();

      // Clear existing data (optional, but requested to "pindah ke sini", assuming fresh import)
      // Note: We need to clear backwards due to foreign keys
      await supabase.from('renstra_yearly_values').delete().neq('tahun', 0); // delete all
      await supabase.from('renstra_indikator').delete().neq('id', 'dummy');
      await supabase.from('renstra_sasaran').delete().neq('id', 'dummy');
      await supabase.from('renstra_programs').delete().neq('id', 'dummy');

      let currentProgramName = "";
      let currentProgramId = "";
      let pUrutan = 1;
      
      let currentSasaranName = "";
      let currentSasaranId = "";
      let sUrutan = 1;
      let iUrutan = 1;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 10) continue; // Skip empty/invalid rows
        
        // Skip header row if pasted
        if (row[0] === 'No' || row[1]?.toLowerCase().includes('misi')) continue;

        const rawMisi = row[1]?.trim();
        if (rawMisi && rawMisi !== currentProgramName) {
          currentProgramName = rawMisi;
          
          const { data: pData, error: pErr } = await supabase
            .from('renstra_programs')
            .insert({ nama: currentProgramName, urutan: pUrutan++ })
            .select().single();
            
          if (pErr) throw pErr;
          currentProgramId = pData.id;
        }

        if (!currentProgramId) continue; // Skip if no active program

        const rawSasaran = row[3]?.trim();
        if (rawSasaran && rawSasaran !== currentSasaranName) {
          currentSasaranName = rawSasaran;
          const { data: sData, error: sErr } = await supabase
            .from('renstra_sasaran')
            .insert({ program_id: currentProgramId, nama: currentSasaranName, urutan: sUrutan++ })
            .select().single();
            
          if (sErr) throw sErr;
          currentSasaranId = sData.id;
        }

        if (!currentSasaranId) continue;

        const indikatorNama = row[6]?.trim();
        if (!indikatorNama) continue;

        // Insert Indikator
        const { data: indData, error: iErr } = await supabase
          .from('renstra_indikator')
          .insert({
            sasaran_id: currentSasaranId,
            bagian: row[2]?.trim() || '',
            borang_aipt: row[3]?.trim() || '',
            kode: row[5]?.trim() || '',
            nama: indikatorNama,
            iku_ikt: row[7]?.trim() || '',
            baseline: parseFloat(row[8]) || 0,
            satuan: row[14]?.trim() || '',
            penjelasan: row[15]?.trim() || '',
            pic: row[16]?.trim() || '',
            urutan: iUrutan++
          })
          .select().single();

        if (iErr) throw iErr;

        // Insert Targets (2026-2030 are columns 9-13)
        const targetValues = [];
        const colStart = 9;
        YEARS.forEach((year, index) => {
          const val = row[colStart + index];
          let numVal = 0;
          if (val) {
            // Handle comma as decimal separator in indonesian locale
            const cleanVal = val.replace(/\./g, '').replace(',', '.');
            numVal = parseFloat(cleanVal) || 0;
          }
          targetValues.push({
            indikator_id: indData.id,
            tahun: year,
            bulan: 0,
            target: numVal,
            actual: 0,
            budget: 0
          });
        });

        const { error: tvErr } = await supabase.from('renstra_yearly_values').insert(targetValues);
        if (tvErr) throw tvErr;
      }

      toast.success("Data berhasil diimport!");
      setOpen(false);
      setText("");
      refetchRenstra(); // Refetch all data

    } catch (err: any) {
      console.error(err);
      toast.error("Gagal import: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-md bg-emerald-600 hover:bg-emerald-700 text-white">
          <Upload className="w-4 h-4 mr-2" />
          Import dari Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-500" />
            Import Data Renstra
          </DialogTitle>
          <DialogDescription>
            Copy baris A sampai Q dari Google Sheet / Excel, lalu paste di kotak bawah ini. 
            <br />
            <strong>Peringatan:</strong> Proses ini akan menggantikan semua data Renstra sebelumnya!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Alert variant="destructive" className="bg-rose-50 border-rose-200">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <AlertDescription className="text-rose-700 text-xs font-medium">
              Pastikan Anda meng-copy langsung dari sel (mulai kolom No sampai kolom PIC). Jangan sertakan judul paling atas jika tidak perlu, cukup mulai dari header tabel atau baris data pertama.
            </AlertDescription>
          </Alert>
          
          <Textarea 
            placeholder="Paste (Ctrl+V) data dari Excel di sini..." 
            className="min-h-[250px] font-mono text-xs whitespace-pre bg-muted/30"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Batal</Button>
          <Button 
            onClick={handleImport} 
            disabled={isImporting || !text}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
          >
            {isImporting ? "Mengimport..." : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mulai Import
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
