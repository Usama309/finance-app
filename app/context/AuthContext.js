"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { trackDevice, checkSessionPersistence } from "@/lib/device-tracker";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configured] = useState(() => typeof window !== "undefined" ? isSupabaseConfigured() : false);

  const fetchProfile = useCallback(async (userId) => {
    if (!configured) return null;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (data) setProfile(data);
      return data;
    } catch {
      return null;
    }
  }, [configured]);

  useEffect(() => {
    if (!configured) {
      // Supabase not configured — skip auth, go straight to app in local-only mode
      setLoading(false);
      setUser({ id: "local", email: "local@cashguard" });
      setProfile({ display_name: "Local User", email: "local@cashguard", role: "admin" });
      return;
    }

    // Check "Remember Me" — if off, clear session on new browser session
    checkSessionPersistence();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        // Track device on session restore
        trackDevice(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
          // Track device on sign-in
          if (event === "SIGNED_IN") {
            trackDevice(session.user.id);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile, configured]);

  const signInWithEmail = async (email, password) => {
    if (!configured) return;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUpWithEmail = async (email, password, name) => {
    if (!configured) return;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (configured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.role === "admin";
  const isConfigured = configured;

  return (
    <AuthContext.Provider value={{
      user, profile, loading, isAdmin, isConfigured,
      signInWithEmail, signUpWithEmail, signOut,
      fetchProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
