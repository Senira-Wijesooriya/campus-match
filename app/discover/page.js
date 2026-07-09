"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import SwipeCard from "@/components/SwipeCard";
import BottomNav from "@/components/BottomNav";

export default function DiscoverPage() {
  const router = useRouter();
  const { loading, user, profile } = useProfile();

  const [candidates, setCandidates] = useState([]);
  const [photoUrls, setPhotoUrls] = useState({});
  const [matchedName, setMatchedName] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && !profile) router.replace("/profile-setup");
  }, [loading, user, profile, router]);

  const loadCandidates = useCallback(async () => {
    if (!profile) return;
    setFetching(true);

    // Profiles this user has already swiped on, so we don't show them again.
    const { data: alreadySwiped } = await supabase
      .from("swipes")
      .select("target_id")
      .eq("swiper_id", profile.id);

    const excludeIds = new Set([
      profile.id,
      ...(alreadySwiped || []).map((s) => s.target_id),
    ]);

    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_visible", true);

    const filtered = (allProfiles || []).filter((p) => !excludeIds.has(p.id));
    setCandidates(filtered);

    // Fetch one photo per candidate.
    if (filtered.length > 0) {
      const { data: photos } = await supabase
        .from("photos")
        .select("profile_id, storage_path")
        .in("profile_id", filtered.map((p) => p.id))
        .eq("position", 0);

      const urls = {};
      for (const photo of photos || []) {
        const { data: publicUrl } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(photo.storage_path);
        urls[photo.profile_id] = publicUrl.publicUrl;
      }
      setPhotoUrls(urls);
    }

    setFetching(false);
  }, [profile]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  async function handleSwipe(direction) {
    const target = candidates[0];
    if (!target || !profile) return;

    // Optimistically pop the card off the stack.
    setCandidates((prev) => prev.slice(1));

    await supabase.from("swipes").insert({
      swiper_id: profile.id,
      target_id: target.id,
      direction,
    });

    if (direction === "like") {
      // Check if that insert created a match (the DB trigger handles the
      // actual match row; we just check whether one now exists).
      const { data: matchRow } = await supabase
        .from("matches")
        .select("id")
        .or(
          `and(user_a.eq.${profile.id},user_b.eq.${target.id}),and(user_a.eq.${target.id},user_b.eq.${profile.id})`
        )
        .maybeSingle();

      if (matchRow) {
        setMatchedName(target.display_name);
      }
    }
  }

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
        <h1 className="font-display text-2xl font-semibold mb-4">Discover</h1>

        <div className="relative flex-1 min-h-[420px]">
          {candidates.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-line rounded-3xl">
              <p className="font-display text-xl font-semibold">
                That&apos;s everyone for now
              </p>
              <p className="text-ink/50 text-sm max-w-xs">
                Check back later as more students join campus.
              </p>
            </div>
          )}

          {candidates
            .slice(0, 3)
            .reverse()
            .map((candidate, idx, arr) => (
              <SwipeCard
                key={candidate.id}
                profile={candidate}
                photoUrl={photoUrls[candidate.id]}
                isTop={idx === arr.length - 1}
                onSwipe={handleSwipe}
              />
            ))}
        </div>

        {candidates.length > 0 && (
          <div className="flex justify-center gap-6 mt-6">
            <button
              onClick={() => handleSwipe("pass")}
              className="w-14 h-14 rounded-full border-2 border-crimson text-crimson text-2xl flex items-center justify-center"
              aria-label="Pass"
            >
              ✕
            </button>
            <button
              onClick={() => handleSwipe("like")}
              className="w-14 h-14 rounded-full border-2 border-teal text-teal text-2xl flex items-center justify-center"
              aria-label="Like"
            >
              ♥
            </button>
          </div>
        )}
      </main>

      {matchedName && (
        <div className="fixed inset-0 bg-ink/80 flex items-center justify-center px-6 z-50">
          <div className="bg-cream rounded-3xl p-8 text-center max-w-xs">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-marigold">
              It&apos;s a match
            </p>
            <p className="font-display text-2xl font-semibold mt-2">
              You and {matchedName} liked each other
            </p>
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={() => {
                  setMatchedName(null);
                  router.push("/matches");
                }}
                className="bg-ink text-cream rounded-full py-3 font-medium"
              >
                Say hi
              </button>
              <button
                onClick={() => setMatchedName(null)}
                className="text-ink/60 text-sm"
              >
                Keep browsing
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
