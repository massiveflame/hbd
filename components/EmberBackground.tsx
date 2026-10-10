"use client";

import React, { useMemo } from "react";

/** Gentle ember/starfield: fixed pseudo-random dots with staggered twinkle. CSS-only, transform/opacity only. */
export default function EmberBackground({ count = 26 }: { count?: number }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        // Deterministic pseudo-random so SSR + client match (no hydration flicker)
        const x = (i * 37.7 + 11) % 100;
        const y = (i * 53.3 + 29) % 100;
        const size = 2 + ((i * 7) % 3);
        const duration = 3 + ((i * 13) % 40) / 10;
        const delay = -((i * 17) % 60) / 10;
        const warm = i % 3 !== 0;
        return { x, y, size, duration, delay, warm, id: i };
      }),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* moonlit top glow */}
      <div className="absolute -top-40 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-red-900/20 blur-[140px]" />
      {/* drifting orbs */}
      <div
        className="ember-orb absolute -left-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-red-800/20 blur-[120px]"
        style={{ animation: "ember-drift-a 28s ease-in-out infinite" }}
      />
      <div
        className="ember-orb absolute -right-32 top-1/3 h-[32rem] w-[32rem] rounded-full bg-rose-950/50 blur-[140px]"
        style={{ animation: "ember-drift-b 34s ease-in-out infinite" }}
      />
      <div
        className="ember-orb absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-amber-700/10 blur-[120px]"
        style={{ animation: "ember-drift-a 24s ease-in-out infinite" }}
      />
      {/* twinkling embers */}
      {dots.map((d) => (
        <span
          key={d.id}
          className="ember-dot absolute rounded-full"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
            background: d.warm ? "rgba(251,113,133,0.9)" : "rgba(252,211,77,0.9)",
            boxShadow: d.warm ? "0 0 8px rgba(244,63,94,0.8)" : "0 0 8px rgba(251,191,36,0.7)",
            animation: `ember-twinkle ${d.duration}s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
