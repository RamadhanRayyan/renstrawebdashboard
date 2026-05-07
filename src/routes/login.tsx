import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ context }) => {
    // If we're already logged in, go to the dashboard
    // Wait, the router context doesn't have auth yet, we'll use useAuth hook inside component or just check session directly here.
    const { data } = await supabase.auth.getSession();
    if (data.session && typeof window !== "undefined") {
      throw redirect({ to: "/" });
    }
  },
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
    // Show slow-connection hint after 3 seconds
    slowTimer.current = setTimeout(() => setSlowHint(true), 3000);
  };

  const stopLoading = () => {
    if (slowTimer.current) clearTimeout(slowTimer.current);
    setSlowHint(false);
    setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    startLoading();

    // 10-second timeout so the button can never be stuck forever
    const timeout = new Promise<{ error: { message: string } }>((_, reject) =>
      setTimeout(() => reject(new Error("Koneksi timeout. Coba lagi atau periksa internet Anda.")), 10_000)
    );

    try {
      if (isRegistering) {
        const result = await Promise.race([
          supabase.auth.signUp({ email, password }),
          timeout,
        ]) as Awaited<ReturnType<typeof supabase.auth.signUp>>;

        if (result.error) {
          if (result.error.message.includes("User already registered")) {
            toast.error("Email sudah terdaftar. Silakan langsung login atau gunakan email lain.");
            setIsRegistering(false);
          } else {
            toast.error(`Gagal Daftar: ${result.error.message}`);
          }
        } else {
          toast.success("Registrasi Berhasil!", {
            description: "Silakan cek kotak masuk email Anda untuk melakukan verifikasi akun sebelum login.",
            duration: 6000,
          });
          setIsRegistering(false);
        }
      } else {
        const result = await Promise.race([
          supabase.auth.signInWithPassword({ email, password }),
          timeout,
        ]) as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;

        if (result.error) {
          toast.error(result.error.message);
        } else {
          toast.success("Login berhasil");
          
          // Determine redirect destination based on role
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role, is_approved")
              .eq("id", result.data.user.id)
              .maybeSingle();
              
            if (profile?.role === "admin" && profile?.is_approved) {
              navigate({ to: "/admin" });
            } else {
              navigate({ to: "/" });
            }
          } catch (e) {
            navigate({ to: "/" });
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message ?? "Terjadi kesalahan. Coba lagi.");
    } finally {
      stopLoading();
    }
  };

  const handleGuestLogin = async () => {
    startLoading();
    try {
      const timeout = new Promise<{ error: { message: string } }>((_, reject) =>
        setTimeout(() => reject(new Error("Koneksi timeout. Coba lagi.")) , 10_000)
      );
      const result = await Promise.race([
        supabase.auth.signInWithPassword({ email: "guest@example.com", password: "guestpassword" }),
        timeout,
      ]) as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;

      if (result.error) {
        toast.error("Login Tamu gagal. Pastikan akun guest@example.com sudah dibuat.");
      } else {
        toast.success("Masuk sebagai Tamu");
        navigate({ to: "/" });
      }
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
              ? "Buat akun baru. Akun baru akan memiliki akses Guest secara otomatis." 
              : "Masukkan email Anda untuk masuk ke sistem."}
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
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {slowHint ? "Koneksi lambat, harap tunggu…" : "Memproses…"}
                </span>
              ) : (
                isRegistering ? "Daftar" : "Login"
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
                      Atau masuk sebagai
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGuestLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses…
                    </span>
                  ) : "Lihat sebagai Tamu"}
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
