import { useEffect, useRef, useState } from "react";

export type RevealState = {
  displayed: string;
  pulseChunk: number | null;
  progress: number;
  done: boolean;
};

const DEFAULT_MS = 175;
const DEFAULT_INITIAL_DELAY_MS = 480;

export function useReveal(
  fullText: string | null,
  token: number,
  opts?: { msPerChunk?: number; charsPerChunk?: number; initialDelayMs?: number }
): RevealState {
  const ms = opts?.msPerChunk ?? DEFAULT_MS;
  const charsPerChunk = Math.max(1, opts?.charsPerChunk ?? 1);
  const initialDelayMs = opts?.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
  const [displayed, setDisplayed] = useState("");
  const [pulseChunk, setPulseChunk] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!fullText?.length) {
      setDisplayed("");
      setPulseChunk(null);
      return;
    }

    let offset = 0;
    let chunkIndex = 0;

    const step = () => {
      const next = Math.min(fullText.length, offset + charsPerChunk);
      offset = next;
      setDisplayed(fullText.slice(0, offset));
      setPulseChunk(chunkIndex);
      chunkIndex++;

      if (offset >= fullText.length) {
        setPulseChunk(null);
        return;
      }
      timerRef.current = setTimeout(step, ms);
    };

    setDisplayed("");
    setPulseChunk(null);
    timerRef.current = setTimeout(step, initialDelayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fullText, token, ms, charsPerChunk, initialDelayMs]);

  const len = fullText?.length ?? 0;
  const progress = len === 0 ? 0 : displayed.length / len;

  return {
    displayed,
    pulseChunk,
    progress,
    done: len > 0 && displayed.length >= len,
  };
}
