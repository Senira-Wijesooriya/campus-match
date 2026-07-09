"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

export default function Home() {
  const [siteUrl, setSiteUrl] = useState("");

  useEffect(() => {
    // Read the real URL in the browser so the QR code always points at
    // wherever this is actually deployed (localhost while testing, your
    // real domain once it's live).
    setSiteUrl(window.location.origin);
  }, []);

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">
          Campus Match
        </p>
        <h1 className="font-display text-4xl font-semibold mt-2 leading-tight">
          Scan in.
          <br />
          Meet someone new.
        </h1>
        <p className="text-ink/60 mt-3 max-w-xs mx-auto">
          Point your phone camera at the code below to open Campus Match in
          Chrome or Edge.
        </p>
      </div>

      <div className="relative bg-white rounded-2xl border border-line shadow-sm p-6">
        <div className="badge-punch" />
        <div className="mt-4">
          {siteUrl ? (
            <QRCodeSVG value={siteUrl} size={200} fgColor="#16213e" />
          ) : (
            <div className="w-[200px] h-[200px] bg-line/40 animate-pulse rounded-lg" />
          )}
        </div>
        <p className="font-mono text-[11px] mt-4 text-ink/50 break-all">
          {siteUrl || "loading..."}
        </p>
      </div>

      <Link
        href="/login"
        className="w-full max-w-xs bg-ink text-cream font-medium rounded-full py-3 hover:bg-ink/90 transition"
      >
        Already scanned? Continue on this phone
      </Link>
    </main>
  );
}
