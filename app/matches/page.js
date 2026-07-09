"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import BottomNav from "@/components/BottomNav";

export default function MatchesPage() {
  const router = useRouter();
  const { loading, user, profile } = useProfile();
  const [matches, setMatches] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && !profile) router.replace("/profile-setup");
  }, [loading, user, profile, router]);

  useEffect(() => {
    async function load() {
      if (!profile) return;
      setFetching(true);

      const { data: matchRows } = await supabase
        .from("matches")
        .select("id, user_a, user_b, created_at")
        .or(`user_a.eq.${profile.id},user_b.eq.${profile.id}`)
        .order("created_at", { ascending: false });

      const otherIds = (matchRows || []).map((m) =>
        m.user_a === profile.id ? m.user_b : m.user_a
      );

      let others = [];
      if (otherIds.length > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", otherIds);
        others = data || [];
      }

      const enriched = (matchRows || []).map((m) => {
        const otherId = m.user_a === profile.id ? m.user_b : m.user_a;
        const other = others.find((o) => o.id === otherId);
        return { ...m, otherName: other?.display_name || "Someone" };
      });

      setMatches(enriched);
      setFetching(false);
    }
    load();
  }, [profile]);

  if (loading || fetching) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="font-mono text-xs text-ink/50 uppercase tracking-wide">
          Loading…
        </p>
      </main>
    );
  }

  return (
    <>
      <main className="flex-1 flex flex-col px-6 py-6">
        <h1 className="font-display text-2xl font-semibold mb-4">Matches</h1>

        {matches.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-line rounded-3xl">
            <p className="font-display text-xl font-semibold">No matches yet</p>
            <p className="text-ink/50 text-sm max-w-xs">
              Keep swiping on Discover — matches show up here.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {matches.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/chat/${m.id}`}
                  className="flex items-center justify-between bg-white border border-line rounded-2xl px-5 py-4"
                >
                  <span className="font-display text-lg font-medium">
                    {m.otherName}
                  </span>
                  <span className="text-teal font-mono text-xs">CHAT →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <BottomNav />
    </>
  );
}
