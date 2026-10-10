"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import confetti from "canvas-confetti";
import Image from "next/image";
import { Camera, Heart, Music2, Pause, Play, Sparkles, X, type LucideIcon } from "lucide-react";
import EmberBackground from "./EmberBackground";

/* ------------------------------------------------------------------ */
/*  Edit your words here                                               */
/* ------------------------------------------------------------------ */
const NAME = "Mahathi";
const DATE_LABEL = "October 11";

type LyricSongId = "untouchable" | "mine" | "enchanted" | "never-grow-up" | "paper-rings";

const SONGS: Record<LyricSongId, { title: string; album: string; file: string }> = {
  untouchable: { title: "Untouchable", album: "Fearless", file: "/songs/untouchable.mp3" },
  mine: { title: "Mine", album: "Speak Now", file: "/songs/mine.mp3" },
  enchanted: { title: "Enchanted", album: "Speak Now", file: "/songs/enchanted.mp3" },
  "never-grow-up": { title: "Never Grow Up", album: "Speak Now", file: "/songs/never-grow-up.mp3" },
  "paper-rings": { title: "Paper Rings", album: "Lover", file: "/songs/paper-rings.mp3" },
};

type Segment = { t: string; song?: LyricSongId };

const LETTER_TITLE = "Happy 23rd Birthday, Maha!";
const LETTER: Segment[][] = [
  [
    {
      t: "I spent a long time thinking about how incredibly lucky I am, and honestly, I just have to thank God for two things: first, for creating you, and second, for bringing you into my life.",
    },
  ],
  [
    { t: "Being with you feels like " },
    { t: "falling in love with the night", song: "untouchable" },
    {
      t: ", where the rest of the world fades away and everything just makes sense. Every single day, you remind me that ",
    },
    { t: "you are the best thing that's ever been mine", song: "mine" },
    {
      t: ". You bring so much warmth, laughter, and light into my life that ",
    },
    { t: "I can't take my eyes off you", song: "untouchable" },
    { t: ", and every moment spent with you leaves me " },
    { t: "wonderstruck, blushing all the way home", song: "enchanted" },
    { t: "." },
  ],
  [
    {
      t: "Watching you step into 23 with so much grace, ambition, and heart is pure magic. As you begin this brand-new chapter, I know in my heart that ",
    },
    { t: "you're gonna do great things", song: "never-grow-up" },
    {
      t: ". Through every peak, valley, and quiet moment in between, ",
    },
    { t: "I'll be there if you want me", song: "paper-rings" },
    { t: ", holding your hand through it all." },
  ],
  [
    {
      t: "Mahathi, thank you for being my constant, my favorite memory, and my brightest future. I hope this 23rd year brings you all the happiness, magic, and love you so effortlessly give to everyone around you.",
    },
  ],
  [{ t: "Happy Birthday, my love." }],
];
const SIGN_OFF = "Always yours";

const MEMORIES: { icon: LucideIcon; title: string; caption: string; image?: string; song?: { title: string; file: string } }[] = [
  {
    icon: Camera,
    title: "U being cute and me being an idiot",
    caption: "Replace me with the moment you still smile about.",
    image: "/photos/first-photo.jpeg",
  },
  {
    icon: Music2,
    title: "Our song",
    caption: "Closer — press play, this one's ours.",
    song: { title: "Closer", file: "/songs/closer.mp3" },
  },
];

/* ------------------------------------------------------------------ */
/*  Shared motion helpers                                              */
/* ------------------------------------------------------------------ */
const SPRING = { type: "spring", stiffness: 150, damping: 18 } as const;
const SOFT_SPRING = { type: "spring", stiffness: 120, damping: 16 } as const;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const SERIF: React.CSSProperties = {
  fontFamily: "var(--font-cormorant), Georgia, serif",
};
const SANS: React.CSSProperties = {
  fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
};

/** Pointer/touch driven 3D tilt built on motion values + springs. */
function useTilt(max = 10) {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 150, damping: 18 });
  const sy = useSpring(py, { stiffness: 150, damping: 18 });
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const glowX = useTransform(sx, [0, 1], ["0%", "100%"]);
  const glowY = useTransform(sy, [0, 1], ["0%", "100%"]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      px.set((e.clientX - r.left) / r.width);
      py.set((e.clientY - r.top) / r.height);
    },
    [px, py]
  );
  const reset = useCallback(() => {
    px.set(0.5);
    py.set(0.5);
  }, [px, py]);

  return { rotateX, rotateY, glowX, glowY, handlers: { onPointerMove, onPointerLeave: reset, onPointerUp: reset } };
}

/* ------------------------------------------------------------------ */
/*  Envelope hero                                                      */
/* ------------------------------------------------------------------ */
type Phase = "closed" | "breaking" | "opening" | "reading" | "open";

const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2;
  const d = 46 + (i % 3) * 18;
  return { x: Math.cos(a) * d, y: Math.sin(a) * d, s: 3 + (i % 3) * 2 };
});

function Envelope({ phase, flapOpen, letterOut, onOpen }: {
  phase: Phase;
  flapOpen: boolean;
  letterOut: boolean;
  onOpen: () => void;
}) {
  const tilt = useTilt(12);
  const [flapBehind, setFlapBehind] = useState(false);
  const sealGone = phase !== "closed";
  const label = phase === "closed" ? "Break the seal and open the letter" : "Read the letter again";

  return (
    <div className="flex justify-center" style={{ perspective: 1000 }}>
      <motion.button
        type="button"
        aria-label={label}
        onClick={onOpen}
        {...tilt.handlers}
        style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformStyle: "preserve-3d" }}
        whileTap={{ scale: 0.98 }}
        className="relative aspect-[3/2] w-[min(86vw,26rem)] cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b0304]"
      >
        {/* ground glow */}
        <div className="pointer-events-none absolute -inset-6 rounded-full bg-red-600/25 blur-3xl" />

        {/* back panel */}
        <div className="absolute inset-0 rounded-md bg-gradient-to-b from-stone-900 via-red-950/70 to-black shadow-2xl shadow-black/70 ring-1 ring-red-500/20" />

        {/* letter */}
        <motion.div
          initial={false}
          animate={{ y: letterOut ? "-58%" : "-3%" }}
          transition={SOFT_SPRING}
          style={{ zIndex: letterOut ? 25 : 10 }}
          className="absolute inset-x-[6%] top-[4%] h-[88%] rounded-sm bg-amber-50 p-4 shadow-lg"
        >
          <div className="space-y-2 pt-3 opacity-60">
            <div className="h-1 w-1/2 rounded bg-rose-800/40" />
            <div className="h-1 w-5/6 rounded bg-slate-900/15" />
            <div className="h-1 w-2/3 rounded bg-slate-900/15" />
          </div>
        </motion.div>

        {/* front pocket */}
        <div
          className="absolute inset-0 z-20 rounded-md bg-gradient-to-br from-stone-800 via-red-950/80 to-black"
          style={{ clipPath: "polygon(0 0, 50% 56%, 100% 0, 100% 100%, 0 100%)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* flap */}
        <motion.div
          initial={false}
          animate={{ rotateX: flapOpen ? 180 : 0 }}
          transition={SPRING}
          onUpdate={(l) => setFlapBehind(Number(l.rotateX) > 90)}
          style={{
            transformOrigin: "top",
            transformStyle: "preserve-3d",
            zIndex: flapBehind ? 5 : 30,
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
          }}
          className="absolute inset-x-0 top-0 h-[56%]"
        >
          <div
            className="absolute inset-0 bg-gradient-to-b from-stone-700 via-red-950/60 to-stone-900"
            style={{ backfaceVisibility: "hidden" }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black via-red-950/70 to-stone-800"
            style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
          />
        </motion.div>

        {/* wax seal + burst */}
        <div className="pointer-events-none absolute left-1/2 top-[56%] z-40 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={false}
            animate={sealGone ? { scale: 0, opacity: 0, rotate: -25 } : { scale: 1, opacity: 1, rotate: 0 }}
            transition={SPRING}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 via-rose-700 to-red-950 shadow-[0_0_40px_rgba(220,38,38,0.65)] ring-2 ring-amber-200/30"
          >
            <span style={SERIF} className="text-3xl font-semibold italic text-rose-100">M</span>
          </motion.div>
          {phase === "breaking" &&
            PARTICLES.map((p, i) => (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.2 }}
                transition={{ duration: 0.7, ease: EASE_OUT }}
                style={{ width: p.s, height: p.s }}
                className="absolute left-1/2 top-1/2 rounded-full bg-rose-400"
              />
            ))}
        </div>
      </motion.button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Letter modal                                                       */
/* ------------------------------------------------------------------ */
const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.28, delayChildren: 0.35 } },
};
const lineVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT } },
};

function LetterModal({ onClose }: { onClose: () => void }) {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; dx: number }[]>([]);
  const idRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<LyricSongId | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      audioRef.current?.pause();
    };
  }, [onClose]);

  const toggleSong = useCallback(
    async (id: LyricSongId) => {
      const audio = audioRef.current;
      if (!audio) return;
      setAudioError(null);
      // Same song: toggle pause/resume
      if (playingId === id && !audio.paused) {
        audio.pause();
        setIsPaused(true);
        return;
      }
      if (playingId === id && audio.paused) {
        try {
          await audio.play();
          setIsPaused(false);
        } catch {
          setAudioError("Couldn't play that song just now.");
        }
        return;
      }
      // Different song: swap source
      audio.src = SONGS[id].file;
      audio.preload = "none";
      try {
        await audio.play();
        setPlayingId(id);
        setIsPaused(false);
      } catch {
        setAudioError("Couldn't play that song just now.");
      }
    },
    [playingId]
  );

  const stopSong = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setPlayingId(null);
    setIsPaused(false);
  }, []);

  const stamp = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const batch = Array.from({ length: 7 }, () => ({
      id: ++idRef.current,
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      dx: (Math.random() - 0.5) * 120,
    }));
    setStars((s) => [...s, ...batch]);
    setTimeout(() => setStars((s) => s.filter((p) => !batch.some((b) => b.id === p.id))), 1400);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-md sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Birthday letter for ${NAME}`}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 60 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        transition={SPRING}
        className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-2xl bg-amber-50 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.6)] sm:rounded-lg sm:p-10"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close letter"
          className="absolute right-3 top-3 rounded-full p-2.5 text-slate-600 transition-colors hover:bg-rose-800/10 hover:text-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-700"
        >
          <X size={20} />
        </button>

        <span
          style={SANS}
          className="inline-block rounded-full border border-rose-800/30 bg-rose-800/5 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-rose-800"
        >
          DEAREST {NAME.toUpperCase()} • {DATE_LABEL.toUpperCase()}
        </span>

        <h2 style={SERIF} className="mt-5 text-3xl font-semibold leading-tight text-slate-900 sm:text-5xl">
          {LETTER_TITLE}
        </h2>
        <p style={SANS} className="mt-2 flex items-center gap-1.5 text-xs text-rose-800/70">
          <Music2 size={13} /> Tap the sparkling lyrics to play our songs
        </p>

        <motion.div variants={listVariants} initial="hidden" animate="show" className="mt-6 space-y-4">
          {LETTER.map((paragraph, i) => (
            <motion.p key={i} variants={lineVariants} style={SERIF} className="text-lg leading-relaxed text-slate-800 sm:text-xl">
              {paragraph.map((seg, j) =>
                seg.song ? (
                  <button
                    key={j}
                    type="button"
                    onClick={() => toggleSong(seg.song!)}
                    title={`Play ${SONGS[seg.song!].title} — ${SONGS[seg.song!].album}`}
                    aria-label={`Play ${SONGS[seg.song!].title} by Taylor Swift`}
                    className={`inline-flex items-baseline gap-1 rounded -my-1 px-0.5 py-1 underline decoration-rose-400/70 decoration-wavy underline-offset-4 transition-colors hover:bg-rose-800/10 hover:text-rose-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-700 ${
                      playingId === seg.song && !isPaused ? "bg-rose-800/10 text-rose-900" : "text-rose-900"
                    }`}
                  >
                    <span>{seg.t}</span>
                    {playingId === seg.song && !isPaused ? (
                      <span className="inline-flex translate-y-[2px] items-end gap-[2px]" aria-hidden="true">
                        <span className="h-2 w-[2px] animate-pulse rounded bg-rose-600" />
                        <span className="h-3 w-[2px] animate-pulse rounded bg-rose-600 [animation-delay:150ms]" />
                        <span className="h-2 w-[2px] animate-pulse rounded bg-rose-600 [animation-delay:300ms]" />
                      </span>
                    ) : (
                      <Music2 size={12} className="translate-y-[1px] shrink-0 opacity-60" aria-hidden="true" />
                    )}
                  </button>
                ) : (
                  <span key={j}>{seg.t}</span>
                )
              )}
            </motion.p>
          ))}
          <motion.div variants={lineVariants} className="flex items-center justify-between pt-4">
            <p style={SERIF} className="text-xl italic text-rose-800 sm:text-2xl">{SIGN_OFF}</p>
            <motion.button
              type="button"
              onClick={stamp}
              aria-label="Press the heart stamp"
              whileHover={{ scale: 1.08, rotate: -6 }}
              whileTap={{ scale: 0.85, rotate: 6 }}
              transition={SPRING}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-600 to-rose-800 text-rose-100 shadow-lg shadow-rose-900/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
            >
              <Heart size={22} fill="currentColor" />
            </motion.button>
          </motion.div>
          {audioError && (
            <p style={SANS} className="pt-2 text-xs text-rose-700" role="alert">
              {audioError}
            </p>
          )}
        </motion.div>

        {/* Now playing pill — sticky so it stays visible while scrolling */}
        <AnimatePresence>
          {playingId && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              style={SANS}
              className="sticky bottom-3 mx-auto flex w-fit max-w-full items-center gap-2 whitespace-nowrap rounded-full bg-slate-900 py-2 pl-4 pr-2 text-xs text-slate-100 shadow-xl"
            >
              <Music2 size={14} className="shrink-0 text-rose-300" />
              <span className="truncate">
                {SONGS[playingId].title} <span className="text-slate-400">• {SONGS[playingId].album}</span>
              </span>
              <button
                type="button"
                onClick={() => toggleSong(playingId)}
                aria-label={isPaused ? `Resume ${SONGS[playingId].title}` : `Pause ${SONGS[playingId].title}`}
                className="rounded-full bg-white/10 p-2 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300"
              >
                {isPaused ? <Music2 size={14} /> : <Pause size={14} />}
              </button>
              <button
                type="button"
                onClick={stopSong}
                aria-label="Stop song"
                className="rounded-full bg-white/10 p-2 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <audio
          ref={audioRef}
          preload="none"
          onEnded={() => {
            setIsPaused(false);
            setPlayingId(null);
          }}
          onPause={() => setIsPaused(true)}
          onPlay={() => setIsPaused(false)}
        />
      </motion.div>

      {stars.map((s) => (
        <motion.span
          key={s.id}
          initial={{ x: s.x, y: s.y, opacity: 1, scale: 0.6 }}
          animate={{ x: s.x + s.dx, y: s.y - 140 - Math.random() * 60, opacity: 0, scale: 1.2, rotate: 90 }}
          transition={{ duration: 1.2, ease: EASE_OUT }}
          className="pointer-events-none fixed left-0 top-0 z-[60] text-amber-300"
        >
          <Sparkles size={16} />
        </motion.span>
      ))}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Love button                                                        */
/* ------------------------------------------------------------------ */
function LoveButton() {
  const [count, setCount] = useState(0);
  const [heart, setHeart] = useState<confetti.Shape | undefined>(undefined);

  useEffect(() => {
    try {
      setHeart(
        confetti.shapeFromPath({
          path: "M167 72c19-38 77-30 77 20 0 42-48 72-77 108C138 164 90 134 90 92c0-50 58-58 77-20z",
        })
      );
    } catch {
      // SSR / unsupported browsers: fall back to default shapes
      setHeart(undefined);
    }
  }, []);

  const fire = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const origin = { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight };
    const colors = ["#fb7185", "#f43f5e", "#c084fc", "#fbbf24", "#f8fafc"];
    confetti({ particleCount: 60, spread: 80, startVelocity: 38, origin, colors, disableForReducedMotion: true });
    confetti({
      particleCount: 18,
      spread: 60,
      startVelocity: 26,
      gravity: 0.5,
      scalar: 2,
      origin,
      shapes: heart ? [heart] : undefined,
      colors: ["#fb7185", "#e11d48", "#f9a8d4"],
      disableForReducedMotion: true,
    });
    setCount((c) => c + 1);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        type="button"
        onClick={fire}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        transition={SPRING}
        style={SANS}
        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 via-rose-700 to-red-900 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_36px_rgba(220,38,38,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-300"
      >
        <Heart size={18} fill="currentColor" /> Press for Love
      </motion.button>
      <p style={SANS} className="text-xs text-stone-400" aria-live="polite">
        Love sent:{" "}
        <span className="inline-block min-w-[1.5ch] text-rose-300">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={count}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={SPRING}
              className="inline-block"
            >
              {count}
            </motion.span>
          </AnimatePresence>
        </span>{" "}
        {count === 1 ? "time" : "times"}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Memory card                                                        */
/* ------------------------------------------------------------------ */
function MemoryCard({ icon: Icon, title, caption, image, song }: (typeof MEMORIES)[number]) {
  const tilt = useTilt(9);
  const [show, setShow] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const spotlight = useTransform([tilt.glowX, tilt.glowY], ([x, y]) =>
    `radial-gradient(180px circle at ${x} ${y}, rgba(251,113,133,0.18), transparent 70%)`
  );

  const togglePlay = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const audio = audioRef.current;
      if (!audio) return;
      if (!audio.paused) {
        audio.pause();
        setPlaying(false);
        return;
      }
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    },
    []
  );

  return (
    <div style={{ perspective: 800 }}>
      <motion.button
        type="button"
        {...tilt.handlers}
        onPointerEnter={() => setShow(true)}
        onPointerLeave={() => {
          setShow(false);
          tilt.handlers.onPointerLeave();
        }}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onClick={() => setShow((s) => !s)}
        aria-expanded={show}
        style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformStyle: "preserve-3d" }}
        whileTap={{ scale: 0.97 }}
        className="group relative w-full overflow-hidden rounded-2xl border border-red-500/25 bg-black/50 p-6 text-left backdrop-blur-sm transition-colors duration-500 hover:border-red-400/50 focus-visible:border-red-400/60 focus-visible:outline-none"
      >
        <motion.div className="pointer-events-none absolute inset-0" style={{ background: spotlight }} />
        <div style={{ transform: "translateZ(30px)" }} className="relative">
          <div className="flex items-center justify-between">
            <Icon size={22} className="text-rose-300" />
            {song && (
              <span
                role="button"
                tabIndex={0}
                onClick={togglePlay}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePlay(e as unknown as React.MouseEvent);
                  }
                }}
                aria-label={playing ? `Pause ${song.title}` : `Play ${song.title}`}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-800 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-red-900/40 transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300"
              >
                {playing ? <Pause size={14} /> : <Play size={14} />}
                {playing ? "Playing" : song.title}
              </span>
            )}
          </div>
          {image && (
            <span className="mt-4 block overflow-hidden rounded-xl ring-1 ring-white/10">
              <Image
                src={image}
                alt={title}
                width={800}
                height={450}
                className="h-auto w-full object-cover"
                sizes="(max-width: 640px) 100vw, 400px"
              />
            </span>
          )}
          <h3 style={SERIF} className="mt-4 text-2xl font-semibold text-stone-100">{title}</h3>
          <motion.p
            initial={false}
            animate={{ height: show ? "auto" : 0, opacity: show ? 1 : 0 }}
            transition={SOFT_SPRING}
            style={SANS}
            className="overflow-hidden text-sm leading-relaxed text-stone-400"
          >
            <span className="block pt-2">{caption}</span>
          </motion.p>
        </div>
        {song && (
          <audio ref={audioRef} src={song.file} preload="none" onEnded={() => setPlaying(false)} />
        )}
      </motion.button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function MahathiBirthday(): React.ReactElement {
  const [phase, setPhase] = useState<Phase>("closed");
  const [flapOpen, setFlapOpen] = useState(false);
  const [letterOut, setLetterOut] = useState(false);
  const busy = useRef(false);

  const openEnvelope = useCallback(async () => {
    if (busy.current) return;
    if (phase === "open") return setPhase("reading");
    if (phase !== "closed") return;
    busy.current = true;
    setPhase("breaking");
    await sleep(500);
    setFlapOpen(true);
    setPhase("opening");
    await sleep(650);
    setLetterOut(true);
    await sleep(800);
    setPhase("reading");
    busy.current = false;
  }, [phase]);

  const closeLetter = useCallback(() => setPhase("open"), []);

  return (
    <main
      className="relative min-h-screen overflow-x-hidden text-stone-100"
      style={{
        ...SANS,
        background: "radial-gradient(120% 90% at 50% 0%, #1c0507 0%, #0b0304 55%, #050101 100%)",
      }}
    >
      <EmberBackground />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-5 pb-20 pt-16 sm:pt-24">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: EASE_OUT }}
          style={SERIF}
          className="text-center text-3xl font-medium text-stone-100 drop-shadow-[0_2px_24px_rgba(220,38,38,0.35)] sm:text-6xl"
        >
          For {NAME}, with love missing you every second from 600km
        </motion.h1>

        <div className="mt-24 sm:mt-28">
          <Envelope phase={phase} flapOpen={flapOpen} letterOut={letterOut} onOpen={openEnvelope} />
        </div>

        <div className="mt-24">
          <LoveButton />
        </div>

        <section aria-label="Memories" className="mt-20 grid w-full gap-5 sm:grid-cols-2">
          {MEMORIES.map((m) => (
            <MemoryCard key={m.title} {...m} />
          ))}
        </section>
      </div>

      <AnimatePresence>{phase === "reading" && <LetterModal onClose={closeLetter} />}</AnimatePresence>
    </main>
  );
}
