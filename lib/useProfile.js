"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Loads the current auth session + their profile row (if created yet).
// Used by every protected page to figure out where to send the user.
export function useProfile() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user ?? null;
      if (!active) return;
      setUser(currentUser);

      if (currentUser) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", currentUser.id)
          .maybeSingle();
        if (!active) return;
        setProfile(profileRow ?? null);
      }
      setLoading(false);
    }

    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return { loading, user, profile };
}
