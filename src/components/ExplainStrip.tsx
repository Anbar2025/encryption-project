import { AnimatePresence, motion } from "framer-motion";

type Props = {
  /** Narration for the latest revealed symbol(s); falls back to idleHint */
  detail: string | null;
  /** 0–1 fraction complete */
  progress: number;
  idleHint?: string;
};

/** Narrated caption synced with the streaming cipher animation */
export function ExplainStrip({ detail, progress, idleHint }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const body =
    detail ??
    idleHint ??
    "Run Encrypt or Decrypt — output streams slowly with narration for each symbol.";

  return (
    <div className="explain-strip mt-3 rounded-xl border border-[var(--border)] bg-[rgba(6,12,26,0.92)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex justify-between items-center gap-3 mb-2">
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[var(--accent)]">
          Step-by-step
        </span>
        <span className="font-mono text-[0.72rem] text-[var(--text-muted)] tabular-nums">
          {pct}% revealed
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={body.slice(0, 120)}
          initial={{ opacity: 0.35, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="m-0 text-[0.88rem] leading-relaxed text-[var(--text)] whitespace-pre-wrap font-mono"
        >
          {body}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
