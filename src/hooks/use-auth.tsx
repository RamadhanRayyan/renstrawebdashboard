import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "guest";

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isApproved: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isApproved: false,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        if (mounted) setUser(session.user);
        
        // Fetch profile
        let { data, error } = await supabase
          .from("profiles")
          .select("role, is_approved")
          .eq("id", session.user.id)
          .maybeSingle();

        // If profile doesn't exist, create it as guest
        if (!data && !error) {
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert([{ id: session.user.id, role: "guest", is_approved: true }])
            .select()
            .single();
          
          if (!insertError) data = newProfile;
        }

        if (mounted && data) {
          setRole(data.role as Role);
          setIsApproved(!!data.is_approved);
        }
      } else {
        if (mounted) {
          setUser(null);
          setRole(null);
          setIsApproved(false);
        }
      }
      if (mounted) setIsLoading(false);
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        if (mounted) setUser(session.user);
        
        let { data, error } = await supabase
          .from("profiles")
          .select("role, is_approved")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!data && !error) {
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert([{ id: session.user.id, role: "guest", is_approved: true }])
            .select()
            .single();
          if (!insertError) data = newProfile;
        }

        if (mounted && data) {
          setRole(data.role as Role);
          setIsApproved(!!data.is_approved);
        }
      } else {
        if (mounted) {
          setUser(null);
          setRole(null);
          setIsApproved(false);
        }
      }
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setUser(null);
    setRole(null);
    setIsApproved(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, isApproved, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
