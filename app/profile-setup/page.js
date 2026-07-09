"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/lib/useProfile";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { loading, user, profile } = useProfile();

  const [displayName, setDisplayName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
    if (!loading && profile) {
      // Already has a profile — no need to set one up again.
      router.replace("/discover");
    }
  }, [loading, user, profile, router]);

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function isAdult(dateStr) {
    const dob = new Date(dateStr);
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    return dob <= eighteenYearsAgo;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!isAdult(birthdate)) {
      setError("You must be 18 or older to use Campus Match.");
      return;
    }

    setSaving(true);

    const { data: newProfile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        display_name: displayName,
        birthdate,
        gender,
        bio,
      })
      .select()
      .single();

    if (profileError) {
      setSaving(false);
      setError(profileError.message);
      return;
    }

    if (photoFile) {
      const path = `${user.id}/${Date.now()}-${photoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, photoFile);

      if (!uploadError) {
        await supabase.from("photos").insert({
          profile_id: newProfile.id,
          storage_path: path,
          position: 0,
        });
      }
    }

    setSaving(false);
    router.push("/discover");
  }

  if (loading) return null;

  return (
    <main className="flex-1 flex flex-col px-6 py-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">
        Step 3 of 3
      </p>
      <h1 className="font-display text-3xl font-semibold mt-2">
        Make your badge
      </h1>
      <p className="text-ink/60 mt-2 mb-6">
        This is how other students will see you.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative bg-white rounded-2xl border border-line shadow-sm p-6 flex flex-col items-center">
          <div className="badge-punch" />
          <label className="mt-4 w-28 h-28 rounded-full bg-line/40 overflow-hidden flex items-center justify-center cursor-pointer border-2 border-dashed border-line">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt="Your photo preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-ink/50 text-center px-2">
                Add photo
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </label>
          <p className="font-display text-lg font-semibold mt-3">
            {displayName || "Your name"}
          </p>
          <p className="font-mono text-[11px] text-ink/50">CAMPUS MATCH · MEMBER</p>
        </div>

        <input
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="First name"
          className="border border-line rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-marigold"
        />

        <input
          type="date"
          required
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          className="border border-line rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-marigold"
        />

        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="border border-line rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-marigold"
        >
          <option value="">Gender (optional)</option>
          <option value="woman">Woman</option>
          <option value="man">Man</option>
          <option value="nonbinary">Non-binary</option>
          <option value="other">Other</option>
        </select>

        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A line about yourself…"
          rows={3}
          className="border border-line rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-marigold resize-none"
        />

        {error && <p className="text-crimson text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-ink text-cream font-medium rounded-full py-3 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Start swiping"}
        </button>
      </form>
    </main>
  );
}
