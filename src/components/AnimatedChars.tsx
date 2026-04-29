import { motion } from "framer-motion";

type Props = {
  text: string;
  revealedLen: number;
  pulseIndex: number | null;
  mono?: boolean;
};

export function AnimatedChars({ text, revealedLen, pulseIndex, mono = true }: Props) {
  return (
    <span className={mono ? "font-mono tracking-wide wrap-break" : "tracking-wide wrap-break"}>
      {text.split("").map((ch, i) => {
        const visible = i < revealedLen;
        const pulse = pulseIndex !== null && i === pulseIndex;
        return (
          <motion.span
            key={`${i}-${ch}`}
            className="inline-block px-[1px]"
            initial={false}
            animate={{
              opacity: visible ? 1 : 0.12,
              scale: pulse ? 1.22 : 1,
              y: pulse ? -2 : 0,
              color: pulse ? "var(--accent-bright)" : visible ? "var(--text)" : "var(--text-muted)",
            }}
            transition={{ type: "spring", stiffness: 520, damping: 28 }}
          >
            {ch === " " ? "\u00a0" : ch}
          </motion.span>
        );
      })}
    </span>
  );
}
