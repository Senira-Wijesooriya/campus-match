"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/discover", label: "Discover" },
  { href: "/matches", label: "Matches" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-line bg-cream/95 backdrop-blur px-6 py-3 flex justify-around sticky bottom-0">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`font-mono text-xs uppercase tracking-wide px-4 py-2 rounded-full transition ${
              active ? "bg-ink text-cream" : "text-ink/50"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
