import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
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

  // Track the last userId we successfully fetched a profile for.
  // This prevents duplicate fetchProfile calls when Supabase emits
  // multiple SIGNED_IN events for the same session (known SDK behavior).
  const lastFetchedUserId = useRef<string | null>(null);
  const isFetchingProfile = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    // Deduplicate: skip if already fetching or already done for this user
    if (isFetchingProfile.current || lastFetchedUserId.current === userId) {
      return;
    }

    isFetchingProfile.current = true;
    try {
      let { data, error } = await supabase
        .from("profiles")
        .select("role, is_approved")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("[Auth] Profile fetch error:", error);
        return;
      }

      // Auto-create guest profile if missing
      if (!data) {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert([{ id: userId, role: "guest", is_approved: true }])
          .select()
          .single();

        if (insertError) {
          console.error("[Auth] Profile creation error:", insertError);
          return;
        }
        data = newProfile;
      }

      lastFetchedUserId.current = userId;
      setRole(data.role as Role);
      setIsApproved(!!data.is_approved);
    } catch (e) {
      console.error("[Auth] Unexpected error in fetchProfile:", e);
    } finally {
      isFetchingProfile.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety timeout — 15s to handle Supabase cold starts (free tier can take 8-10s)
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        console.warn("[Auth] Safety timeout — forcing isLoading=false");
        setIsLoading(false);
      }
    }, 15_000);

    // Step 1: Bootstrap from localStorage immediately (no network call).
    // This resolves isLoading quickly for returning users.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        // CRITICAL: Wait for profile fetch so components have role/isApproved
        // before we mark isLoading as false.
        await fetchProfile(session.user.id);
      }
      // Mark loading done — onAuthStateChange handles all future changes
      if (mounted) {
        clearTimeout(safetyTimer);
        setIsLoading(false);
      }
    });

    // Step 2: Subscribe for real-time auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // INITIAL_SESSION is already handled by getSession() above — skip it
        // to avoid a redundant fetchProfile call.
        if (event === "INITIAL_SESSION") return;

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          // Signed out — reset everything including the dedup ref
          setUser(null);
          setRole(null);
          setIsApproved(false);
          lastFetchedUserId.current = null;
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    setUser(null);
    setRole(null);
    setIsApproved(false);
    lastFetchedUserId.current = null;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, isApproved, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
