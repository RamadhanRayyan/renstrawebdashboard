import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [slowHint, setSlowHint] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = () => {
    setLoading(true);
    setSlowHint(false);
    slowTimer.current = setTimeout(() => setSlowHint(true), 3000);
  };

  const stopLoading = () => {
    if (slowTimer.current) clearTimeout(slowTimer.current);
    setSlowHint(false);
    setLoading(false);
  };

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    startLoading();

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Koneksi ke Supabase timeout. Coba matikan VPN/proxy/adblock, lalu refresh halaman.")),
        30_000,
      ),
    );

    try {
      if (isRegistering) {
        const result = await Promise.race([
          supabase.auth.signUp({ email, password }),
          timeout,
        ]) as Awaited<ReturnType<typeof supabase.auth.signUp>>;

        if (result.error) {
          toast.error(`Gagal Daftar: ${result.error.message}`);
          return;
        }

        toast.success("Registrasi Berhasil! Silakan login.");
        setIsRegistering(false);
        return;
      }

      const result = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        timeout,
      ]) as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      toast.success("Login berhasil");
      navigate({ to: "/admin-dashboard", replace: true });
    } catch (err: any) {
      toast.error(
        err.message?.includes("Failed to fetch")
          ? "Browser gagal menghubungi Supabase. Cek koneksi internet, DNS, VPN/proxy, adblock, atau firewall."
          : err.message ?? "Terjadi kesalahan. Coba lagi.",
      );
    } finally {
      stopLoading();
    }
  };

  const handleGuestLogin = async () => {
    startLoading();
    try {
      await supabase.auth.signOut();
      toast.success("Masuk sebagai Tamu");
      navigate({ to: "/guest-dashboard", replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Terjadi kesalahan.");
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{isRegistering ? "Register" : "Login"}</CardTitle>
          <CardDescription>
            {isRegistering
              ? "Buat akun baru. Setelah login akan masuk sebagai Admin."
              : "Masukkan email Anda untuk masuk sebagai Admin."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {slowHint ? "Koneksi lambat, harap tunggu..." : "Memproses..."}
                </span>
              ) : (
                isRegistering ? "Daftar" : "Login Admin"
              )}
            </Button>

            {!isRegistering && (
              <>
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Atau
                    </span>
                  </div>
                </div>
                <Button type="button" variant="outline" className="w-full" onClick={handleGuestLogin} disabled={loading}>
                  Lihat sebagai Tamu
                </Button>
              </>
            )}
          </form>

          <div className="mt-4 text-center text-sm">
            {isRegistering ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
            <button
              type="button"
              className="underline font-medium"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Login" : "Daftar Akun Baru"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
