import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ context }) => {
    // If we're already logged in, go to the dashboard
    // Wait, the router context doesn't have auth yet, we'll use useAuth hook inside component or just check session directly here.
    const { data } = await supabase.auth.getSession();
    if (data.session) {
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
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (isRegistering) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("Email sudah terdaftar. Silakan langsung login atau gunakan email lain.");
          setIsRegistering(false);
        } else {
          toast.error(`Gagal Daftar: ${error.message}`);
        }
      } else {
        toast.success("Registrasi Berhasil!", {
          description: "Silakan cek kotak masuk email Anda untuk melakukan verifikasi akun sebelum login.",
          duration: 6000,
        });
        setIsRegistering(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Login berhasil");
        navigate({ to: "/" });
      }
    }
    setLoading(false);
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: "guest@example.com",
      password: "guestpassword",
    });
    if (error) {
      toast.error("Login Tamu gagal. Pastikan akun guest@example.com sudah dibuat.");
      setLoading(false);
    } else {
      toast.success("Masuk sebagai Tamu");
      navigate({ to: "/" });
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
              {loading ? "Memproses..." : (isRegistering ? "Daftar" : "Login")}
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
