import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function messageFromError(error: unknown): string {
  if (error == null) return "Terjadi kesalahan yang tidak diketahui.";
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return String(error);
}

interface RenstraFetchAlertProps {
  error: unknown;
  onRetry?: () => void;
}

export function RenstraFetchAlert({ error, onRetry }: RenstraFetchAlertProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Gagal memuat data dari Supabase</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-destructive/90 pr-0 sm:pr-4">{messageFromError(error)}</p>
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRetry()}
            className="shrink-0 border-destructive/40 bg-transparent"
          >
            Coba lagi
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
