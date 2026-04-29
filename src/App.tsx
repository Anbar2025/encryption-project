import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  AffinePanel,
  CaesarPanel,
  ColumnarPanel,
  HillPanel,
  OtpPanel,
  RailPanel,
  VigenerePanel,
} from "./panels/Panels";

const TABS = [
  { id: "caesar", label: "Caesar" },
  { id: "vigenere", label: "Vigenère" },
  { id: "affine", label: "Affine" },
  { id: "hill", label: "Hill" },
  { id: "otp", label: "OTP" },
  { id: "rail", label: "Rail Fence" },
  { id: "columnar", label: "Columnar" },
] as const;

export default function App() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("caesar");

  return (
    <>
      <div className="grain" aria-hidden />
      <div className="relative z-[1] min-h-screen pb-16 font-[family-name:var(--font-sans)]">
      <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="px-[clamp(1rem,4vw,3rem)] pt-8 pb-4"
        >
          <div className="flex items-center gap-4">
            <span className="text-[2rem] text-[var(--accent)] drop-shadow-[0_0_12px_var(--accent-glow)]">
              ◇
            </span>
            <div>
              <h1 className="m-0 text-[clamp(1.75rem,4vw,2.25rem)] font-bold tracking-tight">
                Cipher Lab
              </h1>
              <p className="m-0 mt-1 text-[var(--text-muted)] text-[0.95rem]">
                Classical cryptography — animated step by step
              </p>
            </div>
          </div>
        </motion.header>

        <nav
          className="flex flex-wrap gap-2 px-[clamp(1rem,4vw,3rem)] pb-6"
          role="tablist"
          aria-label="Cipher selection"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`rounded-full px-4 py-2 text-[0.82rem] font-medium transition-colors border border-transparent ${
                tab === t.id
                  ? "bg-gradient-to-br from-[rgba(91,141,239,0.35)] to-[rgba(62,207,154,0.2)] border-[var(--border)] text-[var(--text)] shadow-[0_0_24px_rgba(91,141,239,0.15)]"
                  : "bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)] hover:bg-[rgba(91,141,239,0.12)] hover:text-[var(--text)]"
              }`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <main className="max-w-[960px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <AnimatePresence mode="wait">
            <motion.article
              key={tab}
              role="tabpanel"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-panel)] backdrop-blur-xl shadow-[0_24px_48px_rgba(0,0,0,0.35)] p-7"
            >
              {tab === "caesar" && <CaesarPanel />}
              {tab === "vigenere" && <VigenerePanel />}
              {tab === "affine" && <AffinePanel />}
              {tab === "hill" && <HillPanel />}
              {tab === "otp" && <OtpPanel />}
              {tab === "rail" && <RailPanel />}
              {tab === "columnar" && <ColumnarPanel />}
            </motion.article>
          </AnimatePresence>
        </main>

        <footer className="text-center py-9 text-[0.8rem] text-[var(--text-muted)]">
          Educational demo · Not for production security
        </footer>
      </div>
    </>
  );
}
