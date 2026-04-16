// ── Helpers ──────────────────────────────────────────
function mod(n, m) { return ((n % m) + m) % m; }
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

function modInverse(a, m) {
  for (let x = 1; x < m; x++) {
    if ((a * x) % m === 1) return x;
  }
  return -1;
}

// ── Tab Switcher ─────────────────────────────────────
function showTab(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  event.target.classList.add('active');
}

// ── Caesar ───────────────────────────────────────────
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function caesarEncrypt(text, shift) {
  text = text.toUpperCase();
  let result = "";
  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    if (ALPHABET.includes(char)) {
      let index = ALPHABET.indexOf(char);
      let newIndex = (index + shift + 26) % 26;
      result += ALPHABET[newIndex];
    } else {
      result += char;
    }
  }
  return result;
}

function caesarDecrypt(text, shift) {
  return caesarEncrypt(text, -shift);
}

function caesarRun(mode) {
  const text  = document.getElementById('c-text').value;
  const shift = parseInt(document.getElementById('c-shift').value) || 0;

  const result = mode === 'encrypt'
    ? caesarEncrypt(text, shift)
    : caesarDecrypt(text, shift);

  // Step-by-step display
  let stepsHTML = '';
  const upper = text.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const char = upper[i];
    if (ALPHABET.includes(char)) {
      const index    = ALPHABET.indexOf(char);
      const s        = mode === 'encrypt' ? shift : -shift;
      const newIndex = (index + s + 26) % 26;
      stepsHTML += `<div class="step">${char} (${index}) → <span>${ALPHABET[newIndex]} (${newIndex})</span> &nbsp; (${index} + ${s} + 26) % 26 = ${newIndex}</div>`;
    }
  }

  document.getElementById('c-out').textContent = result || '—';
  document.getElementById('c-steps').innerHTML = stepsHTML;
}

// ── Vigenère (from PDF) ───────────────────────────────

// Step 1: Key Generation — repeat key to match message length
function generateKey(msg, key) {
  msg = msg.toUpperCase();
  key = key.toUpperCase();

  let keyArr = key.split("");

  if (msg.length === keyArr.length) {
    return keyArr.join("");
  }

  for (let i = 0; i < msg.length - key.length; i++) {
    keyArr.push(keyArr[i % keyArr.length]);
  }

  return keyArr.join("");
}

// Step 2: Encrypt — E = (P + K) mod 26
function encryptVigenere(msg, key) {
  msg = msg.toUpperCase();
  key = generateKey(msg, key);

  let encrypted = [];

  for (let i = 0; i < msg.length; i++) {
    let char = msg[i];

    if (char >= "A" && char <= "Z") {
      let p = char.charCodeAt(0) - "A".charCodeAt(0);
      let k = key[i].charCodeAt(0) - "A".charCodeAt(0);
      let encryptedChar = String.fromCharCode(((p + k) % 26) + "A".charCodeAt(0));
      encrypted.push(encryptedChar);
    } else {
      encrypted.push(char);
    }
  }

  return encrypted.join("");
}

// Step 3: Decrypt — D = (C - K + 26) mod 26
function decryptVigenere(msg, key) {
  msg = msg.toUpperCase();
  key = generateKey(msg, key);

  let decrypted = [];

  for (let i = 0; i < msg.length; i++) {
    let char = msg[i];

    if (char >= "A" && char <= "Z") {
      let c = char.charCodeAt(0) - "A".charCodeAt(0);
      let k = key[i].charCodeAt(0) - "A".charCodeAt(0);
      let decryptedChar = String.fromCharCode(((c - k + 26) % 26) + "A".charCodeAt(0));
      decrypted.push(decryptedChar);
    } else {
      decrypted.push(char);
    }
  }

  return decrypted.join("");
}

// Step 4: Run from UI
function vigRun(mode) {
  const text = document.getElementById('v-text').value;
  const key  = document.getElementById('v-key').value.replace(/[^a-zA-Z]/g, '');

  if (!key) {
    document.getElementById('v-out').textContent = 'Please enter a keyword.';
    return;
  }

  const result = mode === 'encrypt'
    ? encryptVigenere(text, key)
    : decryptVigenere(text, key);

  // Build step-by-step display
  const msgUp  = text.toUpperCase();
  const extKey = generateKey(msgUp.replace(/[^A-Z]/g,''), key);
  let stepsHTML = '';
  let ki = 0;

  for (let i = 0; i < msgUp.length; i++) {
    const ch = msgUp[i];
    if (ch >= 'A' && ch <= 'Z') {
      const p = ch.charCodeAt(0) - 65;
      const k = extKey[ki].charCodeAt(0) - 65;
      const c = mode === 'encrypt' ? (p + k) % 26 : (c - k + 26) % 26;
      const val = mode === 'encrypt' ? (p + k) % 26 : ((p - k + 26) % 26);
      const op  = mode === 'encrypt' ? `(${p}+${k}) mod 26 = ${val}` : `(${p}−${k}+26) mod 26 = ${val}`;
      stepsHTML += `<div class="step">${ch} (${p}) + Key[${extKey[ki]}=${k}] → <span>${String.fromCharCode(val+65)} (${val})</span> &nbsp; ${op}</div>`;
      ki++;
    }
  }

  document.getElementById('v-out').textContent = result || '—';
  document.getElementById('v-steps').innerHTML = stepsHTML;
}

// ── Affine ───────────────────────────────────────────
function affRun(mode) {
  const text = document.getElementById('a-text').value;
  const a    = parseInt(document.getElementById('a-a').value);
  const b    = parseInt(document.getElementById('a-b').value);

  if (gcd(a, 26) !== 1) {
    document.getElementById('a-out').textContent = 'Error: a must be coprime to 26 (try 5, 7, 11...)';
    return;
  }

  const aInv = modInverse(a, 26);
  let result = '';
  let stepsHTML = '';

  for (let ch of text) {
    if (/[a-zA-Z]/.test(ch)) {
      const upper = ch.toUpperCase();
      const x = upper.charCodeAt(0) - 65;
      let c, note;

      if (mode === 'encrypt') {
        c    = mod(a * x + b, 26);
        note = `(${a}×${x} + ${b}) mod 26 = ${c}`;
      } else {
        c    = mod(aInv * (x - b), 26);
        note = `${aInv}×(${x}−${b}) mod 26 = ${c}`;
      }

      const out = String.fromCharCode(c + (ch === upper ? 65 : 97));
      result += out;
      stepsHTML += `<div class="step">${upper} (${x}) → <span>${String.fromCharCode(c+65)} (${c})</span>  &nbsp; ${note}</div>`;
    } else {
      result += ch;
    }
  }

  document.getElementById('a-out').textContent = result || '—';
  document.getElementById('a-steps').innerHTML = stepsHTML;
}

// ── Hill (3×3) ────────────────────────────────────────
let key_matrix    = Array.from({ length: 3 }, () => Array(3).fill(0));
let message_vector = Array.from({ length: 3 }, () => Array(1).fill(0));
let cipher_matrix  = Array.from({ length: 3 }, () => Array(1).fill(0));

function get_key_matrix(key) {
  let k = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      key_matrix[i][j] = key.charCodeAt(k) % 65;
      k++;
    }
  }
}

function hillEncrypt(message_vector) {
  for (let i = 0; i < 3; i++) {
    cipher_matrix[i][0] = 0;
    for (let x = 0; x < 3; x++) {
      cipher_matrix[i][0] += key_matrix[i][x] * message_vector[x][0];
    }
    cipher_matrix[i][0] = cipher_matrix[i][0] % 26;
  }
}

function hill_cipher(message, key) {
  get_key_matrix(key);
  for (let i = 0; i < 3; i++) {
    message_vector[i][0] = message.charCodeAt(i) % 65;
  }
  hillEncrypt(message_vector);
  let ciphertext = [];
  for (let i = 0; i < 3; i++) {
    ciphertext.push(String.fromCharCode(cipher_matrix[i][0] + 65));
  }
  return ciphertext.join("");
}

function hillRun(mode) {
  const text = document.getElementById('h-text').value.toUpperCase().replace(/[^A-Z]/g, '');
  const key  = document.getElementById('h-key').value.toUpperCase().replace(/[^A-Z]/g, '');

  if (key.length !== 9) {
    document.getElementById('h-out').textContent = 'Error: Key must be exactly 9 letters (for 3×3 matrix).';
    return;
  }
  if (text.length !== 3) {
    document.getElementById('h-out').textContent = 'Error: Message must be exactly 3 letters.';
    return;
  }

  // Only encrypt supported (no inverse for 3x3 in this version)
  if (mode === 'decrypt') {
    document.getElementById('h-out').textContent = 'Decrypt not supported for 3×3 Hill in this version.';
    return;
  }

  get_key_matrix(key);
  const result = hill_cipher(text, key);

  // Step-by-step display
  let stepsHTML = '';
  for (let i = 0; i < 3; i++) {
    const row = key_matrix[i];
    const p0  = message_vector[0][0];
    const p1  = message_vector[1][0];
    const p2  = message_vector[2][0];
    const val = cipher_matrix[i][0];
    stepsHTML += `<div class="step">Row ${i+1}: ${row[0]}×${p0} + ${row[1]}×${p1} + ${row[2]}×${p2} mod 26 = <span>${val} → ${String.fromCharCode(val+65)}</span></div>`;
  }
  stepsHTML += `<div class="step">Key Matrix used: [${key_matrix.map(r => r.join(',')).join(' | ')}]</div>`;

  document.getElementById('h-out').textContent = result || '—';
  document.getElementById('h-steps').innerHTML = stepsHTML;
}
