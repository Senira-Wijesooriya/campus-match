"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setVerifying(true);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    setVerifying(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    if (data?.session) {
      // New or returning user — either way, send them through profile setup;
      // that page redirects onward automatically if a profile already exists.
      router.push("/profile-setup");
    }
  }

  return (
    <main className="flex-1 flex flex-col justify-center px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">
        Step 2 of 3
      </p>
      <h1 className="font-display text-3xl font-semibold mt-2">
        Enter your code
      </h1>
      <p className="text-ink/60 mt-2">
        We sent a 6-digit code to <span className="font-medium">{email}</span>.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="123456"
          className="border border-line rounded-xl px-4 py-3 bg-white text-center text-2xl font-mono tracking-[0.4em] outline-none focus:ring-2 focus:ring-marigold"
        />

        {error && <p className="text-crimson text-sm">{error}</p>}

        <button
          type="submit"
          disabled={verifying || code.length !== 6}
          className="bg-ink text-cream font-medium rounded-full py-3 disabled:opacity-50"
        >
          {verifying ? "Verifying…" : "Verify & continue"}
        </button>
      </form>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  );
}
