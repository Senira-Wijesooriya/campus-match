"use client";

import { useRef, useState } from "react";

export default function SwipeCard({ profile, photoUrl, onSwipe, isTop }) {
  const cardRef = useRef(null);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const startRef = useRef({ x: 0, y: 0 });

  function start(clientX, clientY) {
    if (!isTop) return;
    startRef.current = { x: clientX, y: clientY };
    setDrag((d) => ({ ...d, active: true }));
  }

  function move(clientX, clientY) {
    if (!drag.active) return;
    setDrag({
      x: clientX - startRef.current.x,
      y: clientY - startRef.current.y,
      active: true,
    });
  }

  function end() {
    if (!drag.active) return;
    const threshold = 100;
    if (drag.x > threshold) {
      onSwipe("like");
    } else if (drag.x < -threshold) {
      onSwipe("pass");
    }
    setDrag({ x: 0, y: 0, active: false });
  }

  const rotation = drag.x / 18;
  const likeOpacity = Math.max(0, Math.min(drag.x / 100, 1));
  const passOpacity = Math.max(0, Math.min(-drag.x / 100, 1));

  const age = profile.birthdate
    ? Math.floor(
        (Date.now() - new Date(profile.birthdate).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <div
      ref={cardRef}
      onMouseDown={(e) => start(e.clientX, e.clientY)}
      onMouseMove={(e) => move(e.clientX, e.clientY)}
      onMouseUp={end}
      onMouseLeave={end}
      onTouchStart={(e) => start(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => move(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={end}
      style={{
        transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)`,
        transition: drag.active ? "none" : "transform 0.25s ease",
      }}
      className="absolute inset-0 bg-white rounded-3xl border border-line shadow-lg overflow-hidden select-none touch-none"
    >
      <div className="badge-punch z-10" />

      <div className="w-full h-3/5 bg-line/40 relative">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={profile.display_name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink/40 font-mono text-xs">
            NO PHOTO
          </div>
        )}

        <div
          style={{ opacity: likeOpacity }}
          className="absolute top-6 left-6 border-2 border-teal text-teal font-mono font-bold text-xl px-3 py-1 rounded-lg -rotate-12"
        >
          LIKE
        </div>
        <div
          style={{ opacity: passOpacity }}
          className="absolute top-6 right-6 border-2 border-crimson text-crimson font-mono font-bold text-xl px-3 py-1 rounded-lg rotate-12"
        >
          PASS
        </div>
      </div>

      <div className="p-5">
        <p className="font-display text-2xl font-semibold">
          {profile.display_name}
          {age ? <span className="text-ink/50 font-sans text-lg"> · {age}</span> : null}
        </p>
        <p className="font-mono text-[11px] text-ink/50 mt-1">CAMPUS MATCH · MEMBER</p>
        {profile.bio && <p className="text-ink/70 mt-3 text-sm">{profile.bio}</p>}
      </div>
    </div>
  );
}
