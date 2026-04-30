import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, User as UserIcon } from "lucide-react";

interface Profile {
  id: string;
  role: string;
  is_approved: boolean;
  created_at: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat daftar pengguna");
    } else {
      setUsers(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (id: string, approve: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: approve })
      .eq("id", id);

    if (error) {
      toast.error("Gagal memperbarui status");
    } else {
      toast.success(approve ? "Pengguna disetujui" : "Status diperbarui");
      fetchUsers();
    }
  };

  const handleSetAdmin = async (id: string, isAdmin: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: isAdmin ? "admin" : "guest" })
      .eq("id", id);

    if (error) {
      toast.error("Gagal mengubah role");
    } else {
      toast.success(isAdmin ? "Role diubah ke Admin" : "Role diubah ke Guest");
      fetchUsers();
    }
  };

  if (isLoading) return <div className="text-center py-10 text-sm text-muted-foreground">Memuat daftar pengguna...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <UserIcon className="w-5 h-5" /> Manajemen Pengguna
      </h3>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground font-medium border-b">
            <tr>
              <th className="px-4 py-3">User ID (Profile)</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Belum ada pengguna terdaftar</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-[10px] truncate max-w-[150px]">{u.id}</td>
                  <td className="px-4 py-3 uppercase text-[10px] font-bold">
                    <span className={u.role === 'admin' ? 'text-primary' : 'text-muted-foreground'}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_approved ? (
                      <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <Check className="w-3 h-3" /> APPROVED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <X className="w-3 h-3" /> PENDING
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {!u.is_approved ? (
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => handleApprove(u.id, true)}>
                        Approve
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] text-destructive" onClick={() => handleApprove(u.id, false)}>
                        Revoke
                      </Button>
                    )}
                    
                    {u.role !== 'admin' ? (
                      <Button size="sm" variant="secondary" className="h-7 text-[10px]" onClick={() => handleSetAdmin(u.id, true)}>
                        Make Admin
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => handleSetAdmin(u.id, false)}>
                        Make Guest
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
