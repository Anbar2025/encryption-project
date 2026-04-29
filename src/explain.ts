import { mod26 } from "./ciphers";

function alphaIdx(ch: string): number | null {
  if (ch >= "A" && ch <= "Z") return ch.charCodeAt(0) - 65;
  return null;
}

function modInv26(a: number): number {
  const v = mod26(a);
  for (let i = 1; i < 26; i++) if ((v * i) % 26 === 1) return i;
  return 1;
}

export function explainCaesarEncrypt(plainU: string, cipher: string, idx: number, shift: number): string {
  const ch = plainU[idx];
  const out = cipher[idx];
  const pi = alphaIdx(ch);
  if (pi === null)
    return `Symbol «${ch === "\n" ? "newline" : ch === " " ? "space" : ch}» is copied unchanged — only A–Z are shifted.`;
  const k = mod26(shift);
  const r = mod26(pi + k);
  return `Letter «${ch}» has index ${pi}. Add shift ${shift}: (${pi} + ${k}) mod 26 = ${r} → ciphertext «${out}».`;
}

export function explainCaesarDecrypt(cipherU: string, plain: string, idx: number, shift: number): string {
  const ch = cipherU[idx];
  const out = plain[idx];
  const ci = alphaIdx(ch);
  if (ci === null)
    return `Symbol «${ch === "\n" ? "newline" : ch === " " ? "space" : ch}» copied unchanged.`;
  const k = mod26(shift);
  const r = mod26(ci - k);
  return `Letter «${ch}» has index ${ci}. Subtract shift ${shift}: (${ci} − ${k}) mod 26 = ${r} → plaintext «${out}».`;
}

export function explainVigenere(
  upperMsg: string,
  expandedKey: string,
  out: string,
  idx: number,
  encrypt: boolean
): string {
  const ch = upperMsg[idx];
  const kk = expandedKey[idx];
  const oc = out[idx];
  const pi = alphaIdx(ch);
  const ki = alphaIdx(kk);
  if (pi === null)
    return `Non-letter «${ch === " " ? "space" : ch}» stays at position ${idx + 1}. Keyword aligns only under A–Z.`;
  if (ki === null) return `Expected keyword letter at column ${idx + 1}.`;

  if (encrypt) {
    const r = mod26(pi + ki);
    return `Column ${idx + 1}: «${ch}» (${pi}) + key «${kk}» (${ki}) → (${pi}+${ki}) mod 26 = ${r} → «${oc}».`;
  }
  const ci = pi;
  const r = mod26(ci - ki);
  return `Column ${idx + 1}: «${ch}» (${ci}) − key «${kk}» (${ki}) → (${ci}−${ki}) mod 26 = ${r} → «${oc}».`;
}

export function explainAffineEncrypt(plainU: string, cipher: string, idx: number, a: number, b: number): string {
  const ch = plainU[idx];
  const out = cipher[idx];
  const x = alphaIdx(ch);
  if (x === null) return `«${ch === " " ? "space" : ch}» unchanged — affine applies only to A–Z.`;
  const r = mod26(a * x + b);
  return `«${ch}» → x = ${x}. Encrypt (${a}·${x} + ${b}) mod 26 = ${r} → «${out}».`;
}

export function explainAffineDecrypt(cipherU: string, plain: string, idx: number, a: number, b: number): string {
  const ch = cipherU[idx];
  const out = plain[idx];
  const y = alphaIdx(ch);
  if (y === null) return `«${ch === " " ? "space" : ch}» unchanged.`;
  const aInv = modInv26(a);
  const raw = mod26(aInv * (y - b));
  return `«${ch}» → y = ${y}. Decrypt ${aInv}·(${y} − ${b}) mod 26 = ${raw} → «${out}».`;
}

export function paddedLetters(msg: string, blockSize: number): string {
  let letters = msg.toUpperCase().replace(/[^A-Z]/g, "");
  while (letters.length % blockSize !== 0) letters += "X";
  return letters;
}

export function explainHillEncryptBlock(
  paddedPlain: string,
  cipher: string,
  blockLastIdx: number,
  blockSize: number,
  matrix: number[][]
): string {
  const blockStart = Math.floor(blockLastIdx / blockSize) * blockSize;
  const vec = paddedPlain.slice(blockStart, blockStart + blockSize).split("").map((c) => alphaIdx(c)!);
  const outs = cipher.slice(blockStart, blockStart + blockSize).split("");
  const lines = matrix.map((row, ri) => {
    const sum = row.reduce((acc, val, j) => acc + val * vec[j], 0);
    const z = mod26(sum);
    return `  Row ${ri + 1}: (${row.join(", ")}) · (${vec.join(", ")}) ≡ ${z} → «${outs[ri]}»`;
  });
  return `Block letters ${blockStart + 1}–${blockStart + blockSize}: plaintext indices [${vec.join(", ")}]. Matrix × vector mod 26:\n${lines.join("\n")}`;
}

export function explainHillDecryptBlock(lastIdx: number, blockSize: number): string {
  const b0 = Math.floor(lastIdx / blockSize) * blockSize + 1;
  const b1 = Math.floor(lastIdx / blockSize) * blockSize + blockSize;
  return `Inverse key maps ciphertext letters ${b0}–${b1} back to plaintext indices mod 26 (one column at a time).`;
}

/** Last fully revealed character index from streamed length */
export function lastVisibleCharIndex(displayedLen: number, totalLen: number): number | null {
  if (displayedLen <= 0 || totalLen <= 0) return null;
  return Math.min(displayedLen - 1, totalLen - 1);
}

export function explainOtpByte(
  plainUtf8: Uint8Array,
  keyBytes: Uint8Array,
  hexDisplayedLen: number
): string | null {
  if (hexDisplayedLen < 2)
    return "Each output byte is plaintext_byte XOR key_byte. Hex shows two nibbles per byte — watch pairs appear.";
  const byteIdx = hexDisplayedLen / 2 - 1;
  if (byteIdx >= plainUtf8.length) return null;
  const p = plainUtf8[byteIdx];
  const k = keyBytes[byteIdx];
  const c = p ^ k;
  return `Byte ${byteIdx + 1} of ${plainUtf8.length}: plain 0x${p.toString(16).padStart(2, "0")} ⊕ key 0x${k.toString(16).padStart(2, "0")} = 0x${c.toString(16).padStart(2, "0")}.`;
}

export function explainRailCipherSym(kind: "enc" | "dec", idx: number, total: number, outCh: string): string {
  if (kind === "enc")
    return `Ciphertext symbol ${idx + 1}/${total}: «${outCh}». Encryption fills the zigzag left-to-right, then reads rails top→bottom (each rail left→right).`;
  return `Plaintext symbol ${idx + 1}/${total}: «${outCh}». Decryption lays ciphertext into rails in order, then reads along the zigzag path.`;
}

export function explainColumnarEncryptAt(
  scheduleIdx: number,
  schedule: { row: number; col: number }[],
  kw: string,
  matrix: string[][],
  charOut: string
): string {
  if (scheduleIdx < 0 || scheduleIdx >= schedule.length) return "";
  const { row, col } = schedule[scheduleIdx];
  const colLetter = kw[col];
  return `Symbol ${scheduleIdx + 1}/${schedule.length}: take column headed «${colLetter}» (alphabetical keyword order), row ${row + 1} → grid «${matrix[row][col]}» → ciphertext «${charOut}».`;
}

export function explainColumnarDecryptAt(idx: number, outChar: string): string {
  return `Plaintext slot ${idx + 1}: after filling the grid from ciphertext columns, read rows left-to-right → «${outChar}».`;
}
