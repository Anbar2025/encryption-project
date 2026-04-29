/** Classical cipher primitives — pure functions */

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function mod26(n: number): number {
  return ((n % 26) + 26) % 26;
}

export function caesarEncrypt(plaintext: string, shift: number): string {
  plaintext = plaintext.toUpperCase();
  let ciphertext = "";
  const s = mod26(shift);
  for (const char of plaintext) {
    if (ALPHABET.includes(char)) {
      const index = ALPHABET.indexOf(char);
      ciphertext += ALPHABET[mod26(index + s)];
    } else ciphertext += char;
  }
  return ciphertext;
}

export function caesarDecrypt(ciphertext: string, shift: number): string {
  return caesarEncrypt(ciphertext, -shift);
}

export function generateKey(msg: string, key: string): string {
  msg = msg.toUpperCase();
  key = key.toUpperCase().replace(/[^A-Z]/g, "");
  if (!key) key = "A";
  const keyArr = key.split("");
  const originalLen = keyArr.length;
  if (msg.length <= keyArr.length) return keyArr.slice(0, msg.length).join("");
  const repeats = msg.length - originalLen;
  for (let i = 0; i < repeats; i++) keyArr.push(keyArr[i % originalLen]);
  return keyArr.join("");
}

export function encryptVigenere(msg: string, key: string): string {
  msg = msg.toUpperCase();
  key = generateKey(msg, key);
  const encrypted: string[] = [];
  for (let i = 0; i < msg.length; i++) {
    const char = msg[i];
    if (char >= "A" && char <= "Z") {
      const p = char.charCodeAt(0) - 65;
      const k = key[i].charCodeAt(0) - 65;
      encrypted.push(String.fromCharCode(mod26(p + k) + 65));
    } else encrypted.push(char);
  }
  return encrypted.join("");
}

export function decryptVigenere(msg: string, key: string): string {
  msg = msg.toUpperCase();
  key = generateKey(msg, key);
  const decrypted: string[] = [];
  for (let i = 0; i < msg.length; i++) {
    const char = msg[i];
    if (char >= "A" && char <= "Z") {
      const c = char.charCodeAt(0) - 65;
      const k = key[i].charCodeAt(0) - 65;
      decrypted.push(String.fromCharCode(mod26(c - k) + 65));
    } else decrypted.push(char);
  }
  return decrypted.join("");
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export function modInverse(a: number, m: number): number {
  a = ((a % m) + m) % m;
  for (let i = 1; i < m; i++) if ((a * i) % m === 1) return i;
  throw new Error("No modular inverse exists");
}

export function affineEncrypt(plaintext: string, a: number, b: number): string {
  plaintext = plaintext.toUpperCase();
  let ciphertext = "";
  for (const char of plaintext) {
    if (ALPHABET.includes(char)) {
      const x = ALPHABET.indexOf(char);
      ciphertext += ALPHABET[mod26(a * x + b)];
    } else ciphertext += char;
  }
  return ciphertext;
}

export function affineDecrypt(ciphertext: string, a: number, b: number): string {
  ciphertext = ciphertext.toUpperCase();
  const aInv = modInverse(a, 26);
  let plaintext = "";
  for (const char of ciphertext) {
    if (ALPHABET.includes(char)) {
      const y = ALPHABET.indexOf(char);
      plaintext += ALPHABET[mod26(aInv * (y - b))];
    } else plaintext += char;
  }
  return plaintext;
}

export function lettersToMatrix(keyStr: string): number[][] {
  const letters = keyStr.toUpperCase().replace(/[^A-Z]/g, "");
  const n = Math.sqrt(letters.length);
  if (!Number.isInteger(n) || n < 2)
    throw new Error("Key length must be a perfect square (4, 9, …)");
  const M: number[][] = [];
  let k = 0;
  for (let i = 0; i < n; i++) {
    M[i] = [];
    for (let j = 0; j < n; j++) M[i][j] = letters.charCodeAt(k++) - 65;
  }
  return M;
}

export function detMod(matrix: number[][], mod: number): number {
  const n = matrix.length;
  if (n === 1) return mod26(matrix[0][0]);
  if (n === 2) {
    const d = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    return mod26(d);
  }
  if (n === 3) {
    const a = matrix;
    const d =
      a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) -
      a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) +
      a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
    return mod26(d);
  }
  throw new Error("Matrix size must be 2×2 or 3×3");
}

function minorMatrix(matrix: number[][], row: number, col: number): number[][] {
  const n = matrix.length;
  const sub: number[][] = [];
  for (let i = 0; i < n; i++) {
    if (i === row) continue;
    const r: number[] = [];
    for (let j = 0; j < n; j++) {
      if (j === col) continue;
      r.push(matrix[i][j]);
    }
    sub.push(r);
  }
  return sub;
}

function cofactor(matrix: number[][], row: number, col: number): number {
  const minor = minorMatrix(matrix, row, col);
  const sign = (row + col) % 2 === 0 ? 1 : -1;
  if (minor.length === 2) {
    const d = minor[0][0] * minor[1][1] - minor[0][1] * minor[1][0];
    return sign * d;
  }
  return (
    sign *
    (minor[0][0] * (minor[1][1] * minor[2][2] - minor[1][2] * minor[2][1]) -
      minor[0][1] * (minor[1][0] * minor[2][2] - minor[1][2] * minor[2][0]) +
      minor[0][2] * (minor[1][0] * minor[2][1] - minor[1][1] * minor[2][0]))
  );
}

function adjugate(matrix: number[][]): number[][] {
  const n = matrix.length;
  const adj: number[][] = [];
  for (let i = 0; i < n; i++) {
    adj[i] = [];
    for (let j = 0; j < n; j++) adj[i][j] = cofactor(matrix, j, i);
  }
  return adj;
}

export function matrixMultVec(matrix: number[][], vec: number[], mod: number): number[] {
  const n = matrix.length;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) sum += matrix[i][j] * vec[j];
    out.push(mod26(sum));
  }
  return out;
}

export function modMatrixInverse(matrix: number[][], mod: number): number[][] {
  const det = detMod(matrix, mod);
  let detInv: number;
  try {
    detInv = modInverse(det, mod);
  } catch {
    throw new Error("Determinant has no inverse mod 26 — choose another key matrix");
  }
  const adj = adjugate(matrix);
  const n = matrix.length;
  const inv: number[][] = [];
  for (let i = 0; i < n; i++) {
    inv[i] = [];
    for (let j = 0; j < n; j++) inv[i][j] = mod26(detInv * adj[i][j]);
  }
  return inv;
}

export function hillEncryptBlock(message: string, keyStr: string): string {
  const K = lettersToMatrix(keyStr);
  const n = K.length;
  let letters = message.toUpperCase().replace(/[^A-Z]/g, "");
  while (letters.length % n !== 0) letters += "X";
  let out = "";
  for (let b = 0; b < letters.length; b += n) {
    const vec: number[] = [];
    for (let i = 0; i < n; i++) vec.push(letters.charCodeAt(b + i) - 65);
    const c = matrixMultVec(K, vec, 26);
    for (let i = 0; i < n; i++) out += String.fromCharCode(c[i] + 65);
  }
  return out;
}

export function hillDecryptBlock(ciphertext: string, keyStr: string): string {
  const K = lettersToMatrix(keyStr);
  const n = K.length;
  const invK = modMatrixInverse(K, 26);
  let letters = ciphertext.toUpperCase().replace(/[^A-Z]/g, "");
  if (letters.length % n !== 0)
    throw new Error("Ciphertext length must be a multiple of block size");
  let out = "";
  for (let b = 0; b < letters.length; b += n) {
    const vec: number[] = [];
    for (let i = 0; i < n; i++) vec.push(letters.charCodeAt(b + i) - 65);
    const p = matrixMultVec(invK, vec, 26);
    for (let i = 0; i < n; i++) out += String.fromCharCode(p[i] + 65);
  }
  return out;
}

export function randomBytes(len: number): Uint8Array {
  const buf = new Uint8Array(len);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < len; i++) buf[i] = Math.floor(Math.random() * 256);
  }
  return buf;
}

export function uint8ToHex(u8: Uint8Array): string {
  return [...u8].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToUint8(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, "");
  if (clean.length % 2 !== 0) throw new Error("Invalid hex length");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++)
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function otpEncryptBytes(plaintext: string, key: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(plaintext);
  if (key.length < bytes.length) throw new Error("OTP key too short");
  const ciphertext = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) ciphertext[i] = bytes[i] ^ key[i];
  return ciphertext;
}

export function otpDecryptBytes(ciphertext: Uint8Array, key: Uint8Array): string {
  if (key.length < ciphertext.length) throw new Error("OTP key too short");
  const plaintextBytes = new Uint8Array(ciphertext.length);
  for (let i = 0; i < ciphertext.length; i++) plaintextBytes[i] = ciphertext[i] ^ key[i];
  return new TextDecoder().decode(plaintextBytes);
}

export function railFenceEncrypt(plaintext: string, numRails: number): string {
  const rail = Array.from({ length: numRails }, () => Array(plaintext.length).fill(""));
  let row = 0;
  let direction = 1;
  for (let i = 0; i < plaintext.length; i++) {
    rail[row][i] = plaintext[i];
    if (row === 0) direction = 1;
    else if (row === numRails - 1) direction = -1;
    row += direction;
  }
  let ciphertext = "";
  for (let r = 0; r < numRails; r++)
    for (let c = 0; c < plaintext.length; c++) if (rail[r][c] !== "") ciphertext += rail[r][c];
  return ciphertext;
}

export function railFenceDecrypt(ciphertext: string, numRails: number): string {
  const rail = Array.from({ length: numRails }, () => Array(ciphertext.length).fill(""));
  let row = 0;
  let direction = 1;
  for (let i = 0; i < ciphertext.length; i++) {
    rail[row][i] = "*";
    if (row === 0) direction = 1;
    else if (row === numRails - 1) direction = -1;
    row += direction;
  }
  let index = 0;
  for (let r = 0; r < numRails; r++)
    for (let c = 0; c < ciphertext.length; c++)
      if (rail[r][c] === "*" && index < ciphertext.length) {
        rail[r][c] = ciphertext[index];
        index++;
      }
  let result = "";
  row = 0;
  direction = 1;
  for (let i = 0; i < ciphertext.length; i++) {
    result += rail[row][i];
    if (row === 0) direction = 1;
    else if (row === numRails - 1) direction = -1;
    row += direction;
  }
  return result;
}

export function railRowPerColumn(len: number, numRails: number): number[] {
  const rows: number[] = [];
  let row = 0;
  let direction = 1;
  for (let i = 0; i < len; i++) {
    rows.push(row);
    if (row === 0) direction = 1;
    else if (row === numRails - 1) direction = -1;
    row += direction;
  }
  return rows;
}

export function columnarTranspositionEncrypt(plaintext: string, keyword: string): string {
  const kw = keyword.toUpperCase();
  const numCols = kw.length;
  const plain = plaintext.toUpperCase();
  const numRows = Math.ceil(plain.length / numCols);
  const padded = plain.padEnd(numRows * numCols, "X");
  const matrix: string[][] = [];
  let idx = 0;
  for (let r = 0; r < numRows; r++) {
    const row: string[] = [];
    for (let c = 0; c < numCols; c++) row.push(padded[idx++]);
    matrix.push(row);
  }
  const order = [...Array(numCols).keys()].sort((a, b) => kw[a].localeCompare(kw[b]));
  let ciphertext = "";
  for (const col of order)
    for (let row = 0; row < numRows; row++) ciphertext += matrix[row][col];
  return ciphertext;
}

export function columnarTranspositionDecrypt(ciphertext: string, keyword: string): string {
  const kw = keyword.toUpperCase();
  const numCols = kw.length;
  const numRows = Math.ceil(ciphertext.length / numCols);
  const order = [...Array(numCols).keys()].sort((a, b) => kw[a].localeCompare(kw[b]));
  const matrix = Array.from({ length: numRows }, () => Array(numCols).fill(""));
  let index = 0;
  for (const col of order)
    for (let row = 0; row < numRows; row++)
      if (index < ciphertext.length) {
        matrix[row][col] = ciphertext[index];
        index++;
      }
  let plaintext = "";
  for (let row = 0; row < numRows; row++)
    for (let col = 0; col < numCols; col++) plaintext += matrix[row][col];
  return plaintext.replace(/X+$/, "");
}

export function columnarEncryptReadSchedule(
  plaintext: string,
  keyword: string
): { row: number; col: number }[] {
  const kw = keyword.toUpperCase();
  const numCols = kw.length;
  const plain = plaintext.toUpperCase();
  const numRows = Math.ceil(plain.length / numCols);
  const padded = plain.padEnd(numRows * numCols, "X");
  const matrix: string[][] = [];
  let idx = 0;
  for (let r = 0; r < numRows; r++) {
    const row: string[] = [];
    for (let c = 0; c < numCols; c++) row.push(padded[idx++]);
    matrix.push(row);
  }
  const order = [...Array(numCols).keys()].sort((a, b) => kw[a].localeCompare(kw[b]));
  const schedule: { row: number; col: number }[] = [];
  for (const col of order)
    for (let row = 0; row < numRows; row++) schedule.push({ row, col });
  return schedule;
}
