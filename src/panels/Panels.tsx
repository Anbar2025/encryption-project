import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatedChars } from "../components/AnimatedChars";
import { ExplainStrip } from "../components/ExplainStrip";
import { RailFenceViz } from "../components/RailFenceViz";
import { useReveal } from "../hooks/useReveal";
import {
  explainAffineDecrypt,
  explainAffineEncrypt,
  explainCaesarDecrypt,
  explainCaesarEncrypt,
  explainColumnarDecryptAt,
  explainColumnarEncryptAt,
  explainHillDecryptBlock,
  explainHillEncryptBlock,
  explainOtpByte,
  explainRailCipherSym,
  explainVigenere,
  lastVisibleCharIndex,
  paddedLetters,
} from "../explain";
import {
  ALPHABET,
  affineDecrypt,
  affineEncrypt,
  caesarDecrypt,
  caesarEncrypt,
  columnarEncryptReadSchedule,
  columnarTranspositionDecrypt,
  columnarTranspositionEncrypt,
  decryptVigenere,
  detMod,
  encryptVigenere,
  gcd,
  generateKey,
  hexToUint8,
  hillDecryptBlock,
  hillEncryptBlock,
  lettersToMatrix,
  mod26,
  otpDecryptBytes,
  otpEncryptBytes,
  railFenceDecrypt,
  railFenceEncrypt,
  randomBytes,
  uint8ToHex,
} from "../ciphers";

function ProcessBar({ progress }: { progress: number }) {
  return (
    <div className="process-bar">
      <motion.div
        className="process-bar-inner"
        initial={false}
        animate={{ width: `${Math.min(1, progress) * 100}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    </div>
  );
}

function pulseCharIndex(pulseChunk: number | null, charsPerChunk: number, maxLen: number) {
  if (pulseChunk === null || maxLen <= 0) return null;
  const end = Math.min(maxLen - 1, (pulseChunk + 1) * charsPerChunk - 1);
  return Math.max(0, end);
}

export function CaesarPanel() {
  const [plain, setPlain] = useState("HELLO");
  const [cipherIn, setCipherIn] = useState("");
  const [shift, setShift] = useState(3);
  const [cipherAnim, setCipherAnim] = useState<string | null>(null);
  const [plainAnim, setPlainAnim] = useState<string | null>(null);
  const [tokC, setTokC] = useState(0);
  const [tokP, setTokP] = useState(0);
  const rCiph = useReveal(cipherAnim, tokC);
  const rPlain = useReveal(plainAnim, tokP);

  const s = mod26(shift);
  const wheelPairs = useMemo(
    () => ALPHABET.split("").map((p, i) => ({ plain: p, cipher: ALPHABET[mod26(i + s)] })),
    [s]
  );

  const encPlain = plain.toUpperCase();
  const pulseLetterIdx =
    cipherAnim !== null ? pulseCharIndex(rCiph.pulseChunk, 1, encPlain.length) : null;

  const animStr = cipherAnim ?? plainAnim;
  const rev = cipherAnim !== null ? rCiph : rPlain;

  const explainCaesar = useMemo(() => {
    if (!animStr) return null;
    if (!rev.done && rev.displayed.length === 0)
      return "Short pause â€” then letters appear one at a time with indices and modular arithmetic.";
    if (rev.done) return "Complete â€” full message streamed. Verify against your inputs.";
    const idx = lastVisibleCharIndex(rev.displayed.length, animStr.length);
    if (idx === null) return null;
    if (cipherAnim !== null) return explainCaesarEncrypt(encPlain, cipherAnim, idx, shift);
    if (plainAnim !== null)
      return explainCaesarDecrypt(cipherIn.toUpperCase(), plainAnim, idx, shift);
    return null;
  }, [
    animStr,
    cipherAnim,
    plainAnim,
    encPlain,
    cipherIn,
    shift,
    rev.displayed.length,
    rev.done,
  ]);

  return (
    <div className="space-y-4">
      <p className="text-[var(--text-muted)] text-[0.95rem]">
        Each letter shifts along the alphabet. Non-letters are unchanged.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="field-label">Plaintext</span>
          <textarea
            className="field-input min-h-[88px]"
            value={plain}
            onChange={(e) => setPlain(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label">Ciphertext</span>
          <textarea
            className="field-input min-h-[88px]"
            value={cipherIn}
            onChange={(e) => setCipherIn(e.target.value)}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="flex flex-col gap-1 max-w-[120px]">
          <span className="field-label">Shift</span>
          <input
            type="number"
            className="field-input"
            value={shift}
            min={-25}
            max={25}
            onChange={(e) => setShift(Number(e.target.value) || 0)}
          />
        </label>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            const out = caesarEncrypt(plain, shift);
            setPlainAnim(null);
            setCipherAnim(out);
            setTokC((t) => t + 1);
          }}
        >
          Encrypt â†’
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            const out = caesarDecrypt(cipherIn, shift);
            setCipherAnim(null);
            setPlainAnim(out);
            setTokP((t) => t + 1);
          }}
        >
          â† Decrypt
        </button>
      </div>

      {(cipherAnim !== null || plainAnim !== null) && (
        <>
          <div className="output-well min-h-[3rem]">
            <span className="field-label block mb-1 text-[0.65rem]">
              {cipherAnim !== null ? "Animated ciphertext" : "Animated plaintext"}
            </span>
            <AnimatedChars
              text={(cipherAnim ?? plainAnim) || ""}
              revealedLen={(cipherAnim ? rCiph : rPlain).displayed.length}
              pulseIndex={pulseCharIndex((cipherAnim ? rCiph : rPlain).pulseChunk, 1, (cipherAnim ?? plainAnim)?.length ?? 0)}
            />
          </div>
          <ProcessBar progress={(cipherAnim ? rCiph : rPlain).progress} />
          <ExplainStrip
            detail={explainCaesar}
            progress={(cipherAnim ? rCiph : rPlain).progress}
            idleHint="Encrypt shifts each Aâ€“Z letter; decrypt shifts backwards."
          />
        </>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[rgba(5,10,20,0.45)] p-4">
        <div className="text-[0.75rem] text-[var(--text-muted)] mb-2">
          Alphabet mapping (plain â†’ cipher)
        </div>
        <div className="flex flex-wrap gap-1 justify-center">
          {wheelPairs.map(({ plain: pl, cipher: ci }) => (
            <motion.div
              key={pl}
              className="flex flex-col items-center gap-0.5 px-1"
              animate={{
                scale:
                  pulseLetterIdx !== null &&
                  encPlain[pulseLetterIdx] === pl &&
                  /[A-Z]/.test(encPlain[pulseLetterIdx])
                    ? 1.22
                    : 1,
                opacity: 1,
              }}
            >
              <span className="font-mono text-[0.65rem] px-1 py-0.5 rounded bg-[rgba(91,141,239,0.2)] border border-[rgba(91,141,239,0.4)]">
                {pl}
              </span>
              <span className="font-mono text-[0.65rem] px-1 py-0.5 rounded bg-[rgba(62,207,154,0.2)] border border-[rgba(62,207,154,0.35)]">
                {ci}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VigenerePanel() {
  const [text, setText] = useState("ATTACK AT DAWN");
  const [key, setKey] = useState("LEMON");
  const [outAnim, setOutAnim] = useState<string | null>(null);
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [tok, setTok] = useState(0);
  const rev = useReveal(outAnim, tok);

  const upper = text.toUpperCase();
  const expKey = generateKey(upper, key);

  const explainVig = useMemo(() => {
    if (!outAnim) return null;
    if (!rev.done && rev.displayed.length === 0)
      return "Pause â€” then each output letter is built as (plaintext index Â± key index) mod 26 where the key repeats to full message length.";
    if (rev.done) return "Finished â€” polyalphabetic string complete. Keyword row above shows expansion.";
    const idx = lastVisibleCharIndex(rev.displayed.length, outAnim.length);
    if (idx === null) return null;
    return explainVigenere(upper, expKey, outAnim, idx, mode === "encrypt");
  }, [outAnim, upper, expKey, mode, rev.displayed.length, rev.done]);

  const runEncrypt = () => {
    setOutAnim(encryptVigenere(text, key));
    setMode("encrypt");
    setTok((t) => t + 1);
  };
  const runDecrypt = () => {
    setOutAnim(decryptVigenere(text, key));
    setMode("decrypt");
    setTok((t) => t + 1);
  };

  const pi = pulseCharIndex(rev.pulseChunk, 1, outAnim?.length ?? 0);

  return (
    <div className="space-y-4">
      <p className="text-[var(--text-muted)] text-[0.95rem]">
        Keyword shifts repeat â€” polyalphabetic substitution.
      </p>
      <label className="flex flex-col gap-1">
        <span className="field-label">Text</span>
        <textarea className="field-input min-h-[88px]" value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1 max-w-md">
        <span className="field-label">Keyword</span>
        <input className="field-input" value={key} onChange={(e) => setKey(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={runEncrypt}>
          Encrypt
        </button>
        <button type="button" className="btn" onClick={runDecrypt}>
          Decrypt
        </button>
      </div>

      {outAnim !== null && (
        <>
          <div className="output-well">
            <span className="field-label block mb-1 text-[0.65rem]">Result (animated)</span>
            <AnimatedChars text={outAnim} revealedLen={rev.displayed.length} pulseIndex={pi} />
          </div>
          <ProcessBar progress={rev.progress} />
          <ExplainStrip
            detail={explainVig}
            progress={rev.progress}
            idleHint="Polyalphabetic: each letter uses a different Caesar shift from the keyword."
          />
        </>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[rgba(5,10,20,0.45)] p-4 overflow-x-auto">
        <div className="text-[0.75rem] text-[var(--text-muted)] mb-2">
          {mode === "encrypt" ? "Message Â· keyword Â· ciphertext" : "Ciphertext Â· keyword Â· plaintext"}
        </div>
        <div className="text-[0.65rem] text-[var(--text-muted)] mb-1">Row A</div>
        <div className="stripe-row">
          {upper.split("").map((ch, i) => (
            <span
              key={i}
              className={`stripe-cell stripe-msg ${pi === i ? "ring-2 ring-[var(--accent)] rounded" : ""}`}
            >
              {ch}
            </span>
          ))}
        </div>
        <div className="text-[0.65rem] text-[var(--text-muted)] mb-1 mt-2">Keyword (expanded)</div>
        <div className="stripe-row">
          {upper.split("").map((ch, i) => (
            <span key={i} className={`stripe-cell stripe-key ${pi === i ? "ring-2 ring-[var(--accent)] rounded" : ""}`}>
              {ch >= "A" && ch <= "Z" ? expKey[i] : "Â·"}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AffinePanel() {
  const [plain, setPlain] = useState("AFFINE");
  const [a, setA] = useState(5);
  const [b, setB] = useState(8);
  const [cipherAnim, setCipherAnim] = useState<string | null>(null);
  const [plainAnim, setPlainAnim] = useState<string | null>(null);
  const [tokC, setTokC] = useState(0);
  const [tokP, setTokP] = useState(0);
  const rC = useReveal(cipherAnim, tokC);
  const rP = useReveal(plainAnim, tokP);
  const valid = gcd(a, 26) === 1;
  const hint = valid ? "" : `gcd(${a}, 26) â‰  1 â€” pick a âˆˆ {1,3,5,7,9,11,15,17,19,21,23,25}`;

  const plainU = plain.toUpperCase();

  const explainAff = useMemo(() => {
    const anim = cipherAnim ?? plainAnim;
    const rev = cipherAnim !== null ? rC : rP;
    if (!anim) return null;
    if (!rev.done && rev.displayed.length === 0)
      return "Pause â€” affine applies E(x)=(aÂ·x+b) mod 26 to each letter index x.";
    if (rev.done) return "Streaming complete â€” compare ciphertext/plaintext above.";
    const idx = lastVisibleCharIndex(rev.displayed.length, anim.length);
    if (idx === null) return null;
    if (cipherAnim !== null) return explainAffineEncrypt(plainU, cipherAnim, idx, a, b);
    if (plainAnim !== null) return explainAffineDecrypt(plainU, plainAnim, idx, a, b);
    return null;
  }, [
    cipherAnim,
    plainAnim,
    plainU,
    a,
    b,
    rC.displayed.length,
    rP.displayed.length,
    rC.done,
    rP.done,
  ]);

  return (
    <div className="space-y-4">
      <p className="text-[var(--text-muted)] text-[0.95rem]">E(x) = (aÂ·x + b) mod 26, with gcd(a,26) = 1.</p>
      {hint && <p className="text-[var(--coral)] text-sm">{hint}</p>}
      <label className="flex flex-col gap-1">
        <span className="field-label">Text (plain / cipher depending on button)</span>
        <textarea className="field-input min-h-[72px]" value={plain} onChange={(e) => setPlain(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="flex flex-col gap-1 max-w-[100px]">
          <span className="field-label">a</span>
          <input type="number" className="field-input" value={a} min={1} max={25} onChange={(e) => setA(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 max-w-[100px]">
          <span className="field-label">b</span>
          <input type="number" className="field-input" value={b} min={0} max={25} onChange={(e) => setB(Number(e.target.value))} />
        </label>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!valid}
          onClick={() => {
            setPlainAnim(null);
            setCipherAnim(affineEncrypt(plain, a, b));
            setTokC((t) => t + 1);
          }}
        >
          Encrypt
        </button>
        <button
          type="button"
          className="btn"
          disabled={!valid}
          onClick={() => {
            setCipherAnim(null);
            try {
              setPlainAnim(affineDecrypt(plain, a, b));
              setTokP((t) => t + 1);
            } catch {
              /* invalid key */
            }
          }}
        >
          Decrypt
        </button>
      </div>

      {(cipherAnim !== null || plainAnim !== null) && (
        <>
          <div className="output-well">
            <AnimatedChars
              text={(cipherAnim ?? plainAnim) || ""}
              revealedLen={(cipherAnim ? rC : rP).displayed.length}
              pulseIndex={pulseCharIndex((cipherAnim ? rC : rP).pulseChunk, 1, (cipherAnim ?? plainAnim)?.length ?? 0)}
            />
          </div>
          <ProcessBar progress={(cipherAnim ? rC : rP).progress} />
          <ExplainStrip
            detail={explainAff}
            progress={(cipherAnim ? rC : rP).progress}
            idleHint="Affine maps letter indices with (aÂ·x+b) mod 26; decryption uses the modular inverse of a."
          />
        </>
      )}

      {valid && (
        <div className="flex flex-wrap gap-1">
          {ALPHABET.split("").map((L, i) => (
            <span
              key={L}
              className="font-mono text-[0.7rem] px-1 py-0.5 rounded bg-[rgba(255,255,255,0.06)]"
            >
              {L}â†’{ALPHABET[mod26(a * i + b)]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function HillPanel() {
  const [hillKey, setHillKey] = useState("GYBN");
  const [msg, setMsg] = useState("HELP");
  const [outAnim, setOutAnim] = useState<string | null>(null);
  const [tok, setTok] = useState(0);
  const [err, setErr] = useState("");
  const [hillKind, setHillKind] = useState<"enc" | "dec">("enc");

  let n = 2;
  try {
    const letters = hillKey.toUpperCase().replace(/[^A-Z]/g, "");
    const s = Math.sqrt(letters.length);
    if (Number.isInteger(s)) n = s;
  } catch {
    /* noop */
  }

  const ms = useReveal(outAnim, tok, {
    msPerChunk: 380,
    charsPerChunk: n,
    initialDelayMs: 540,
  });

  const padded = useMemo(() => paddedLetters(msg, n), [msg, n]);

  const matrix = useMemo(() => {
    try {
      return lettersToMatrix(hillKey);
    } catch {
      return null;
    }
  }, [hillKey]);

  const run = (kind: "enc" | "dec") => {
      setErr("");
      try {
        const out =
          kind === "enc" ? hillEncryptBlock(msg, hillKey) : hillDecryptBlock(msg, hillKey);
        setHillKind(kind);
        setOutAnim(out);
        setTok((t) => t + 1);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
      setOutAnim(null);
    }
  };

  const pi = pulseCharIndex(ms.pulseChunk, n, outAnim?.length ?? 0);

  const explainHill = useMemo(() => {
    if (!outAnim || !matrix) return null;
    if (!ms.done && ms.displayed.length === 0)
      return "Pause â€” each block is a matrix Ã— column vector mod 26 (letters as 0â€“25). Padding X completes short blocks.";
    if (ms.done) return "All blocks processed â€” ciphertext/plaintext matches the linear algebra above.";
    const idx = lastVisibleCharIndex(ms.displayed.length, outAnim.length);
    if (idx === null) return null;
    if (hillKind === "enc") return explainHillEncryptBlock(padded, outAnim, idx, n, matrix);
    return explainHillDecryptBlock(idx, n);
  }, [outAnim, matrix, padded, n, hillKind, ms.displayed.length, ms.done]);

  return (
    <div className="space-y-4">
      <p className="text-[var(--text-muted)] text-[0.95rem]">
        Square matrix key (4 or 9 letters). Blocks padded with X.
      </p>
      <label className="flex flex-col gap-1">
        <span className="field-label">Key (row-major letters)</span>
        <input className="field-input" value={hillKey} onChange={(e) => setHillKey(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="field-label">Message block(s)</span>
        <input className="field-input" value={msg} onChange={(e) => setMsg(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={() => run("enc")}>
          Encrypt block
        </button>
        <button type="button" className="btn" onClick={() => run("dec")}>
          Decrypt block
        </button>
      </div>
      {err && <p className="text-[var(--coral)] text-sm">{err}</p>}

      {matrix && (
        <div>
          <div className="text-[0.8rem] text-[var(--text-muted)] mb-2">Key matrix mod 26 Â· det â‰¡ {detMod(matrix, 26)}</div>
          <div className="matrix-grid" style={{ gridTemplateColumns: `repeat(${matrix.length}, 1fr)` }}>
            {matrix.flatMap((row, i) =>
              row.map((v, j) => (
                <span key={`${i}-${j}`} className="matrix-cell">
                  {v}
                </span>
              ))
            )}
          </div>
        </div>
      )}

      {outAnim !== null && (
        <>
          <div className="output-well font-mono text-lg tracking-[0.2em]">
            <AnimatedChars text={outAnim} revealedLen={ms.displayed.length} pulseIndex={pi} />
          </div>
          <ProcessBar progress={ms.progress} />
          <ExplainStrip
            detail={explainHill}
            progress={ms.progress}
            idleHint="Hill multiplies the key matrix against each plaintext block (as numbers mod 26)."
          />
        </>
      )}
    </div>
  );
}

export function OtpPanel() {
  const [plain, setPlain] = useState("Secret!");
  const [keyHex, setKeyHex] = useState("");
  const [cipherTarget, setCipherTarget] = useState<string | null>(null);
  const [cipherPaste, setCipherPaste] = useState("");
  const [plainAnim, setPlainAnim] = useState<string | null>(null);
  const [tokC, setTokC] = useState(0);
  const [tokP, setTokP] = useState(0);
  const keyBytesRef = useRef<Uint8Array | null>(null);

  const revC = useReveal(cipherTarget, tokC, {
    msPerChunk: 115,
    charsPerChunk: 2,
    initialDelayMs: 520,
  });
  const revP = useReveal(plainAnim, tokP, { msPerChunk: 155, initialDelayMs: 520 });

  const plainUtf8 = useMemo(() => new TextEncoder().encode(plain), [plain]);

  const explainOtpCipher = useMemo(() => {
    if (cipherTarget === null || !keyBytesRef.current) return null;
    if (!revC.done && revC.displayed.length === 0)
      return "Pause â€” ciphertext hex streams two characters per byte (one byte at a time). Each byte equals plaintext-byte XOR key-byte.";
    if (revC.done) return "Encrypt stream finished â€” full hex copied to the editor below.";
    return (
      explainOtpByte(plainUtf8, keyBytesRef.current, revC.displayed.length) ??
      "Receiving next hex digitsâ€¦"
    );
  }, [cipherTarget, plainUtf8, revC.displayed.length, revC.done, tokC]);

  const explainOtpPlain = useMemo(() => {
    if (!plainAnim) return null;
    if (!revP.done && revP.displayed.length === 0)
      return "Pause â€” XOR inversion rebuilds UTF-8 plaintext character by character.";
    if (revP.done) return "Decrypt stream finished â€” plaintext restored.";
    const idx = lastVisibleCharIndex(revP.displayed.length, plainAnim.length);
    if (idx === null) return null;
    return `Plaintext symbol ${idx + 1}/${plainAnim.length}: Â«${plainAnim[idx]}Â» â€” byte-wise XOR with the same key reverses encryption.`;
  }, [plainAnim, revP.displayed.length, revP.done]);

  useEffect(() => {
    if (cipherTarget && revC.done) {
      setCipherPaste(cipherTarget);
      setCipherTarget(null);
    }
  }, [cipherTarget, revC.done]);

  const genKey = () => {
    const enc = new TextEncoder();
    const len = enc.encode(plain).length;
    keyBytesRef.current = randomBytes(len);
    setKeyHex(uint8ToHex(keyBytesRef.current));
    setCipherTarget(null);
  };

  const encrypt = () => {
    const enc = new TextEncoder();
    const len = enc.encode(plain).length;
    if (!keyBytesRef.current || keyBytesRef.current.length < len) {
      keyBytesRef.current = randomBytes(len);
      setKeyHex(uint8ToHex(keyBytesRef.current));
    }
    const ct = otpEncryptBytes(plain, keyBytesRef.current);
    const hex = uint8ToHex(ct);
    setPlainAnim(null);
    setCipherTarget(hex);
    setTokC((t) => t + 1);
  };

  const decrypt = () => {
    try {
      const c = hexToUint8(cipherPaste.replace(/\s+/g, ""));
      const k = hexToUint8(keyHex.replace(/\s+/g, ""));
      keyBytesRef.current = k;
      const pt = otpDecryptBytes(c, k);
      setCipherTarget(null);
      setPlainAnim(pt);
      setTokP((t) => t + 1);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const hexPulse =
    cipherTarget !== null
      ? pulseCharIndex(revC.pulseChunk, 2, cipherTarget.length)
      : null;

  return (
    <div className="space-y-4">
      <p className="text-[var(--text-muted)] text-[0.95rem]">Xor UTF-8 bytes with a random key (never reuse).</p>
      <label className="flex flex-col gap-1">
        <span className="field-label">Plaintext</span>
        <textarea className="field-input min-h-[72px]" value={plain} onChange={(e) => setPlain(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={genKey}>
          Generate random key
        </button>
        <button type="button" className="btn" onClick={encrypt}>
          Encrypt (xor)
        </button>
        <button type="button" className="btn" onClick={decrypt}>
          Decrypt
        </button>
      </div>
      <label className="flex flex-col gap-1">
        <span className="field-label">Key (hex)</span>
        <textarea className="field-input min-h-[56px] font-mono text-xs" value={keyHex} onChange={(e) => setKeyHex(e.target.value)} />
      </label>

      {cipherTarget !== null && (
        <div className="output-well font-mono text-xs wrap-break">
          <span className="field-label block mb-2 text-[0.65rem]">Ciphertext hex (streaming xor)</span>
          <AnimatedChars text={cipherTarget} revealedLen={revC.displayed.length} pulseIndex={hexPulse} />
          <ProcessBar progress={revC.progress} />
          <ExplainStrip
            detail={explainOtpCipher}
            progress={revC.progress}
            idleHint="OTP XORs raw UTF-8 bytes â€” identical length key, never reused elsewhere."
          />
        </div>
      )}

      <label className="flex flex-col gap-1">
        <span className="field-label">Ciphertext hex (editable · filled when encrypt completes)</span>
        <textarea
          className="field-input min-h-[72px] font-mono text-xs"
          value={cipherPaste}
          onChange={(e) => setCipherPaste(e.target.value)}
          placeholder="Paste hex here for decrypt"
        />
      </label>

      {plainAnim !== null && (
        <div className="output-well">
          <span className="field-label block mb-1 text-[0.65rem]">Plaintext (animated decrypt)</span>
          <AnimatedChars
            text={plainAnim}
            revealedLen={revP.displayed.length}
            pulseIndex={pulseCharIndex(revP.pulseChunk, 1, plainAnim.length)}
          />
          <ProcessBar progress={revP.progress} />
          <ExplainStrip
            detail={explainOtpPlain}
            progress={revP.progress}
            idleHint="Decrypt XORs ciphertext bytes with your key bytes to recover plaintext."
          />
        </div>
      )}
    </div>
  );
}

export function RailPanel() {
  const [input, setInput] = useState("WEAREDISCOVERED");
  const [rails, setRails] = useState(3);
  const [railKind, setRailKind] = useState<"enc" | "dec">("enc");
  const [outAnim, setOutAnim] = useState<string | null>(null);
  const [tok, setTok] = useState(0);
  const ms = useReveal(outAnim, tok);

  const clean = useMemo(() => input.toUpperCase().replace(/[^A-Z]/g, ""), [input]);

  const runRail = () => {
    if (clean.length < 2) {
      alert("Enter at least two letters A–Z.");
      return;
    }
    const r = Math.min(12, Math.max(2, rails));
    if (r !== rails) setRails(r);
    try {
      const out =
        railKind === "enc" ? railFenceEncrypt(clean, r) : railFenceDecrypt(clean, r);
      setOutAnim(out);
      setTok((t) => t + 1);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const railPulse = pulseCharIndex(ms.pulseChunk, 1, Math.max(1, clean.length));

  const explainRail = useMemo(() => {
    if (!outAnim) return null;
    if (!ms.done && ms.displayed.length === 0)
      return railKind === "enc"
        ? "Pause — ciphertext letters appear as each rail is read left-to-right, top rail first."
        : "Pause — plaintext rebuilds by walking the zigzag path after ciphertext fills the rails.";
    if (ms.done) return "Stream finished — compare to the zigzag visualization.";
    const idx = lastVisibleCharIndex(ms.displayed.length, outAnim.length);
    if (idx === null) return null;
    return explainRailCipherSym(railKind, idx, outAnim.length, outAnim[idx]);
  }, [outAnim, railKind, ms.displayed.length, ms.done]);

  return (
    <div className="space-y-4">
      <p className="text-[var(--text-muted)] text-[0.95rem]">
        Write in a zigzag across rows, then read along rails (encrypt). Decrypt reverses that refill-and-read path.
      </p>
      <div className="flex flex-wrap gap-3 items-center">
        <label className="flex items-center gap-2 text-[0.85rem]">
          <span className="text-[var(--text-muted)]">Mode</span>
          <select
            className="field-input py-1.5 max-w-[180px]"
            value={railKind}
            onChange={(e) => setRailKind(e.target.value as "enc" | "dec")}
          >
            <option value="enc">Encrypt</option>
            <option value="dec">Decrypt</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-[0.85rem]">
          <span className="text-[var(--text-muted)]">Rails</span>
          <input
            type="number"
            min={2}
            max={12}
            className="field-input py-1.5 w-20"
            value={rails}
            onChange={(e) => setRails(Number(e.target.value) || 2)}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="field-label">{railKind === "enc" ? "Plaintext (A–Z)" : "Ciphertext (A–Z)"}</span>
        <textarea className="field-input min-h-[72px] font-mono" value={input} onChange={(e) => setInput(e.target.value)} />
      </label>
      <button type="button" className="btn btn-primary" onClick={runRail}>
        {railKind === "enc" ? "Encrypt" : "Decrypt"}
      </button>

      {clean.length >= 2 && (
        <RailFenceViz text={clean} rails={Math.min(12, Math.max(2, rails))} activeColumn={railPulse} />
      )}

      {outAnim !== null && (
        <>
          <div className="output-well font-mono text-lg tracking-[0.15em]">
            <span className="field-label block mb-2 text-[0.65rem]">{railKind === "enc" ? "Ciphertext" : "Plaintext"}</span>
            <AnimatedChars
              text={outAnim}
              revealedLen={ms.displayed.length}
              pulseIndex={pulseCharIndex(ms.pulseChunk, 1, outAnim.length)}
            />
          </div>
          <ProcessBar progress={ms.progress} />
          <ExplainStrip
            detail={explainRail}
            progress={ms.progress}
            idleHint={
              railKind === "enc"
                ? "Letters bounce along rows; ciphertext concatenates rails from top down."
                : "Lay ciphertext into rails in order, then read along the zigzag."
            }
          />
        </>
      )}
    </div>
  );
}

export function ColumnarPanel() {
  const [inp, setInp] = useState("ATTACKATDAWN");
  const [keyword, setKeyword] = useState("SECRET");
  const [kind, setKind] = useState<"enc" | "dec">("enc");
  const [outAnim, setOutAnim] = useState<string | null>(null);
  const [tok, setTok] = useState(0);
  const ms = useReveal(outAnim, tok);

  const kwClean = keyword.toUpperCase().replace(/[^A-Z]/g, "");

  const letters = useMemo(() => inp.toUpperCase().replace(/[^A-Z]/g, ""), [inp]);

  const encCtx = useMemo(() => {
    if (kind !== "enc" || kwClean.length === 0 || letters.length === 0) return null;
    const schedule = columnarEncryptReadSchedule(letters, keyword);
    const numCols = kwClean.length;
    const numRows = Math.ceil(letters.length / numCols);
    const padded = letters.padEnd(numRows * numCols, "X");
    const matrix: string[][] = [];
    let mi = 0;
    for (let row = 0; row < numRows; row++) {
      const rowCells: string[] = [];
      for (let col = 0; col < numCols; col++) rowCells.push(padded[mi++]);
      matrix.push(rowCells);
    }
    return { schedule, matrix, kw: kwClean };
  }, [kind, letters, keyword, kwClean]);

  const runColumnar = () => {
    if (kwClean.length === 0) {
      alert("Keyword must contain at least one letter A–Z.");
      return;
    }
    if (letters.length === 0) {
      alert("Enter letters A–Z in the message.");
      return;
    }
    try {
      const out =
        kind === "enc"
          ? columnarTranspositionEncrypt(letters, keyword)
          : columnarTranspositionDecrypt(letters, keyword);
      setOutAnim(out);
      setTok((t) => t + 1);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const explainCol = useMemo(() => {
    if (!outAnim) return null;
    if (!ms.done && ms.displayed.length === 0)
      return kind === "enc"
        ? "Pause — ciphertext picks letters column-by-column in alphabetical keyword order."
        : "Pause — plaintext appears as rows are read after the grid is filled.";
    if (ms.done) return "Stream finished.";
    const idx = lastVisibleCharIndex(ms.displayed.length, outAnim.length);
    if (idx === null) return null;
    if (kind === "enc" && encCtx) {
      return explainColumnarEncryptAt(idx, encCtx.schedule, encCtx.kw, encCtx.matrix, outAnim[idx]);
    }
    if (kind === "dec") return explainColumnarDecryptAt(idx, outAnim[idx]);
    return null;
  }, [outAnim, kind, encCtx, ms.displayed.length, ms.done]);

  return (
    <div className="space-y-4">
      <p className="text-[var(--text-muted)] text-[0.95rem]">
        Letters fill a rectangle row-wise; columns are taken in keyword alphabetical order (padding with X).
      </p>
      <div className="flex flex-wrap gap-3 items-center">
        <label className="flex items-center gap-2 text-[0.85rem]">
          <span className="text-[var(--text-muted)]">Mode</span>
          <select
            className="field-input py-1.5 max-w-[180px]"
            value={kind}
            onChange={(e) => setKind(e.target.value as "enc" | "dec")}
          >
            <option value="enc">Encrypt</option>
            <option value="dec">Decrypt</option>
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="field-label">Keyword (letters)</span>
        <input className="field-input font-mono" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="field-label">{kind === "enc" ? "Plaintext (A–Z)" : "Ciphertext (A–Z)"}</span>
        <textarea className="field-input min-h-[72px] font-mono" value={inp} onChange={(e) => setInp(e.target.value)} />
      </label>
      <button type="button" className="btn btn-primary" onClick={runColumnar}>
        {kind === "enc" ? "Encrypt" : "Decrypt"}
      </button>

      {outAnim !== null && (
        <>
          <div className="output-well font-mono text-lg tracking-[0.12em]">
            <span className="field-label block mb-2 text-[0.65rem]">{kind === "enc" ? "Ciphertext" : "Plaintext"}</span>
            <AnimatedChars
              text={outAnim}
              revealedLen={ms.displayed.length}
              pulseIndex={pulseCharIndex(ms.pulseChunk, 1, outAnim.length)}
            />
          </div>
          <ProcessBar progress={ms.progress} />
          <ExplainStrip
            detail={explainCol}
            progress={ms.progress}
            idleHint={
              kind === "enc"
                ? "Sort keyword letters alphabetically to decide column extraction order."
                : "Split ciphertext into column heights, unwarp rows to rebuild plaintext."
            }
          />
        </>
      )}
    </div>
  );
}
