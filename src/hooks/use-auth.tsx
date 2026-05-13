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
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isAuthBootstrapped, setIsAuthBootstrapped] = useState(false);
  const [profileStatus, setProfileStatus] = useState<"idle" | "loading" | "loaded">("idle");

  // Track the last userId we successfully fetched a profile for.
  // This prevents duplicate fetchProfile calls when Supabase emits
  // multiple SIGNED_IN events for the same session (known SDK behavior).
  const lastFetchedUserId = useRef<string | null>(null);
  const inFlightProfilePromise = useRef<Promise<void> | null>(null);
  const inFlightProfileUserId = useRef<string | null>(null);

  const resetProfileState = useCallback(() => {
    setRole(null);
    setIsApproved(false);
    setProfileStatus("idle");
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_user_id");
      localStorage.removeItem("auth_role");
      localStorage.removeItem("auth_isApproved");
    }
    lastFetchedUserId.current = null;
    inFlightProfilePromise.current = null;
    inFlightProfileUserId.current = null;
  }, []);

  const applyProfileState = useCallback((userId: string, nextRole: Role, nextIsApproved: boolean) => {
    lastFetchedUserId.current = userId;
    setRole(nextRole);
    setIsApproved(nextIsApproved);
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_user_id", userId);
      localStorage.setItem("auth_role", nextRole);
      localStorage.setItem("auth_isApproved", String(nextIsApproved));
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    if (lastFetchedUserId.current === userId) {
      setProfileStatus("loaded");
      return;
    }

    if (
      inFlightProfilePromise.current &&
      inFlightProfileUserId.current === userId
    ) {
      await inFlightProfilePromise.current;
      return;
    }

    setProfileStatus("loading");

    const profilePromise = (async () => {
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
            .select("role, is_approved")
            .single();

          if (insertError) {
            console.error("[Auth] Profile creation error:", insertError);
            return;
          }
          data = newProfile;
        }

        applyProfileState(userId, data.role as Role, !!data.is_approved);
      } catch (e) {
        console.error("[Auth] Unexpected error in fetchProfile:", e);
      } finally {
        setProfileStatus("loaded");
        inFlightProfilePromise.current = null;
        inFlightProfileUserId.current = null;
      }
    })();

    inFlightProfilePromise.current = profilePromise;
    inFlightProfileUserId.current = userId;

    await profilePromise;
  }, [applyProfileState]);

  useEffect(() => {
    let mounted = true;

    // Safety timeout — 15s to handle Supabase cold starts (free tier can take 8-10s)
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        console.warn("[Auth] Safety timeout — forcing auth bootstrap/profile completion");
        setIsAuthBootstrapped(true);
        setProfileStatus((current) => (current === "loading" ? "loaded" : current));
      }
    }, 15_000);

    // Step 1: Bootstrap from localStorage immediately (no network call).
    // This resolves isLoading quickly for returning users, but signed-in users
    // still wait until their profile role has been loaded.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        if (typeof window !== "undefined" && localStorage.getItem("auth_user_id") === session.user.id) {
          const cachedRole = localStorage.getItem("auth_role") as Role | null;
          if (cachedRole === "admin" || cachedRole === "guest") {
            setRole(cachedRole);
            setIsApproved(localStorage.getItem("auth_isApproved") === "true");
          }
        }
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        resetProfileState();
      }

      if (mounted) {
        setIsAuthBootstrapped(true);
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
          setUser(null);
          resetProfileState();
        }

        setIsAuthBootstrapped(true);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchProfile, resetProfileState]);

  const signOut = async () => {
    setUser(null);
    resetProfileState();
    await supabase.auth.signOut();
  };

  const isLoading = !isAuthBootstrapped || (user !== null && profileStatus !== "loaded");

  return (
    <AuthContext.Provider value={{ user, role, isApproved, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
