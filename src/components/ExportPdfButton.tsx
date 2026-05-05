import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExportPdfButtonProps {
  targetId: string;
  filename?: string;
  className?: string;
}

export function ExportPdfButton({ targetId, filename = "report.pdf", className }: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const element = document.getElementById(targetId);
    if (!element) {
      toast.error("Elemen tidak ditemukan untuk di-export.");
      return;
    }

    try {
      setIsExporting(true);

      // Lazy-load heavy PDF libs only when user actually clicks export
      const [html2canvasModule, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const html2canvas = html2canvasModule.default;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);
      toast.success("Berhasil mengekspor PDF!");
    } catch (error) {
      console.error("Export PDF error:", error);
      toast.error("Gagal mengekspor PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExport} 
      disabled={isExporting}
      className={className}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      <span className="hidden sm:inline">Export PDF</span>
      <span className="sm:hidden">PDF</span>
    </Button>
  );
}
