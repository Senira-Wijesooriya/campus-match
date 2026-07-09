"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/lib/useProfile";

export default function ChatPage() {
  const { matchId } = useParams();
  const router = useRouter();
  const { loading, user, profile } = useProfile();

  const [messages, setMessages] = useState([]);
  const [otherName, setOtherName] = useState("");
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && !profile) router.replace("/profile-setup");
  }, [loading, user, profile, router]);

  useEffect(() => {
    async function load() {
      if (!profile || !matchId) return;

      const { data: matchRow } = await supabase
        .from("matches")
        .select("user_a, user_b")
        .eq("id", matchId)
        .single();

      if (matchRow) {
        const otherId =
          matchRow.user_a === profile.id ? matchRow.user_b : matchRow.user_a;
        const { data: otherProfile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", otherId)
          .single();
        setOtherName(otherProfile?.display_name || "");
      }

      const { data: existingMessages } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      setMessages(existingMessages || []);
    }
    load();
  }, [profile, matchId]);

  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`messages-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim() || !profile) return;

    const content = draft.trim();
    setDraft("");

    await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: profile.id,
      content,
    });
  }

  if (loading) return null;

  return (
    <div className="flex-1 flex flex-col h-screen">
      <header className="border-b border-line px-6 py-4 flex items-center gap-3">
        <Link href="/matches" className="text-ink/50 font-mono text-xs">
          ← BACK
        </Link>
        <h1 className="font-display text-lg font-semibold">{otherName}</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
        {messages.length === 0 && (
          <p className="text-ink/40 text-sm text-center mt-8 font-mono">
            Say hi to {otherName || "your match"} 👋
          </p>
        )}

        {messages.map((m) => {
          const mine = m.sender_id === profile?.id;
          return (
            <div
              key={m.id}
              className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                mine
                  ? "bg-ink text-cream self-end"
                  : "bg-white border border-line self-start"
              }`}
            >
              {m.content}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="border-t border-line px-4 py-3 flex gap-2"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 border border-line rounded-full px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-marigold"
        />
        <button
          type="submit"
          className="bg-ink text-cream rounded-full px-5 py-2 font-medium text-sm"
        >
          Send
        </button>
      </form>
    </div>
  );
}
