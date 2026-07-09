"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isAllowedEmail, ALLOWED_EMAIL_DOMAIN } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!isAllowedEmail(email)) {
      setError(`Please use your @${ALLOWED_EMAIL_DOMAIN} email to sign up.`);
      return;
    }

    setSending(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setSending(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    router.push(`/verify?email=${encodeURIComponent(email)}`);
  }

  return (
    <main className="flex-1 flex flex-col justify-center px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">
        Step 1 of 3
      </p>
      <h1 className="font-display text-3xl font-semibold mt-2">
        What&apos;s your email?
      </h1>
      <p className="text-ink/60 mt-2">
        We&apos;ll text you a one-time code — no password to remember.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="border border-line rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-marigold"
        />

        {error && <p className="text-crimson text-sm">{error}</p>}

        <button
          type="submit"
          disabled={sending}
          className="bg-ink text-cream font-medium rounded-full py-3 disabled:opacity-50"
        >
          {sending ? "Sending code…" : "Send me a code"}
        </button>
      </form>
    </main>
  );
}
