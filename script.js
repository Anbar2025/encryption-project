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
function caesarRun(mode) {
  const text  = document.getElementById('c-text').value;
  const shift = parseInt(document.getElementById('c-shift').value) || 0;
  const s     = mode === 'encrypt' ? shift : -shift;
  let result  = '';
  let stepsHTML = '';

  for (let ch of text) {
    if (/[a-zA-Z]/.test(ch)) {
      const upper = ch.toUpperCase();
      const x = upper.charCodeAt(0) - 65;
      const y = mod(x + s, 26);
      const out = String.fromCharCode(y + (ch === upper ? 65 : 97));
      result += out;
      stepsHTML += `<div class="step">${upper} (${x}) → <span>${String.fromCharCode(y+65)} (${y})</span>  &nbsp; (${x} + ${mod(s,26)}) mod 26 = ${y}</div>`;
    } else {
      result += ch;
    }
  }

  document.getElementById('c-out').textContent   = result || '—';
  document.getElementById('c-steps').innerHTML   = stepsHTML;
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

// ── Hill ─────────────────────────────────────────────
function hillRun(mode) {
  const text = document.getElementById('h-text').value.toUpperCase().replace(/[^A-Z]/g, '');
  const m = [
    [parseInt(document.getElementById('h00').value), parseInt(document.getElementById('h01').value)],
    [parseInt(document.getElementById('h10').value), parseInt(document.getElementById('h11').value)]
  ];

  // Check invertibility
  const det  = mod(m[0][0]*m[1][1] - m[0][1]*m[1][0], 26);
  const detInv = modInverse(det, 26);

  if (detInv < 0) {
    document.getElementById('h-out').textContent = 'Error: Matrix is not invertible mod 26.';
    return;
  }

  // Compute inverse matrix
  const inv = [
    [mod(detInv * m[1][1], 26),  mod(detInv * -m[0][1], 26)],
    [mod(detInv * -m[1][0], 26), mod(detInv *  m[0][0], 26)]
  ];

  const key = mode === 'encrypt' ? m : inv;
  const padded = text.length % 2 !== 0 ? text + 'X' : text;

  let result = '';
  let stepsHTML = '';

  for (let i = 0; i < padded.length; i += 2) {
    const p1 = padded[i].charCodeAt(0) - 65;
    const p2 = padded[i+1].charCodeAt(0) - 65;
    const c1 = mod(key[0][0]*p1 + key[0][1]*p2, 26);
    const c2 = mod(key[1][0]*p1 + key[1][1]*p2, 26);
    const out = String.fromCharCode(c1+65) + String.fromCharCode(c2+65);
    result += out;
    stepsHTML += `<div class="step">[${padded[i]},${padded[i+1]}] → <span>[${String.fromCharCode(c1+65)},${String.fromCharCode(c2+65)}]</span>  &nbsp; row1: ${key[0][0]}×${p1}+${key[0][1]}×${p2}=${c1}, row2: ${key[1][0]}×${p1}+${key[1][1]}×${p2}=${c2}</div>`;
  }

  document.getElementById('h-out').textContent = result || '—';
  document.getElementById('h-steps').innerHTML = stepsHTML;
}
