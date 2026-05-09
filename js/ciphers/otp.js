// One-Time Pad (Vernam cipher) + Venona depth-attack demo

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function normalize(text) {
  return text.toUpperCase().replace(/[^A-Z]/g, '');
}

// OTP encrypt/decrypt: both are XOR mod 26
function otpApply(text, key) {
  const t = normalize(text);
  const k = normalize(key);
  if (!k.length) return t;
  return t.split('').map((ch, i) => {
    const ti = ALPHA.indexOf(ch);
    const ki = ALPHA.indexOf(k[i % k.length]);
    return ALPHA[(ti + ki) % 26];
  }).join('');
}

function otpDecrypt(cipher, key) {
  const c = normalize(cipher);
  const k = normalize(key);
  if (!k.length) return c;
  return c.split('').map((ch, i) => {
    const ci = ALPHA.indexOf(ch);
    const ki = ALPHA.indexOf(k[i % k.length]);
    return ALPHA[(ci - ki + 26) % 26];
  }).join('');
}

// XOR two ciphertexts (mod 26 subtraction = adding inverse)
// C1 XOR C2 = P1 XOR P2
function xorCiphertexts(c1, c2) {
  const a = normalize(c1);
  const b = normalize(c2);
  const len = Math.min(a.length, b.length);
  let result = '';
  for (let i = 0; i < len; i++) {
    result += ALPHA[(ALPHA.indexOf(a[i]) - ALPHA.indexOf(b[i]) + 26) % 26];
  }
  return result;
}

// Generate a random key of given length
function randomKey(length) {
  return Array.from({ length }, () => ALPHA[Math.floor(Math.random() * 26)]).join('');
}

// ── Frequency analysis on XOR result ──
function letterFrequency(text) {
  const t = normalize(text);
  const freq = Object.fromEntries(ALPHA.split('').map(c => [c, 0]));
  for (const ch of t) freq[ch]++;
  const total = t.length || 1;
  return ALPHA.split('').map(c => ({ letter: c, count: freq[c], pct: freq[c] / total }));
}

// Crib drag over XOR result: try to recover fragments of P1 given known words from P2
// If xorResult = P1 XOR P2, and we know a fragment of P2 at offset,
// we can recover the corresponding fragment of P1
function cribDragXor(xorResult, crib, offset = 0) {
  const x = normalize(xorResult);
  const c = normalize(crib);
  const recovered = [];
  for (let i = 0; i < c.length && offset + i < x.length; i++) {
    const xi = ALPHA.indexOf(x[offset + i]);
    const ci = ALPHA.indexOf(c[i]);
    recovered.push(ALPHA[(xi + ci) % 26]);
  }
  return recovered.join('');
}

export { normalize, otpApply, otpDecrypt, xorCiphertexts, randomKey,
         letterFrequency, cribDragXor, ALPHA };
