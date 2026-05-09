// Vigenère cipher core — Latin alphabet only (uppercase)
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function normalize(text) {
  return text.toUpperCase().replace(/[^A-Z]/g, '');
}

function encrypt(plaintext, keyword) {
  const pt  = normalize(plaintext);
  const key = normalize(keyword);
  if (!key.length) return pt;
  return pt.split('').map((ch, i) => {
    const shift = ALPHA.indexOf(key[i % key.length]);
    return ALPHA[(ALPHA.indexOf(ch) + shift) % 26];
  }).join('');
}

function decrypt(ciphertext, keyword) {
  const ct  = normalize(ciphertext);
  const key = normalize(keyword);
  if (!key.length) return ct;
  return ct.split('').map((ch, i) => {
    const shift = ALPHA.indexOf(key[i % key.length]);
    return ALPHA[(ALPHA.indexOf(ch) - shift + 26) % 26];
  }).join('');
}

// Returns array of {char, keyChar, shift} for visualization
function encryptSteps(plaintext, keyword) {
  const pt  = normalize(plaintext);
  const key = normalize(keyword);
  if (!key.length) return [];
  return pt.split('').map((ch, i) => {
    const kch   = key[i % key.length];
    const shift = ALPHA.indexOf(kch);
    const enc   = ALPHA[(ALPHA.indexOf(ch) + shift) % 26];
    return { plain: ch, key: kch, shift, enc };
  });
}

// ── Frequency analysis ──
function letterFrequency(text) {
  const t = normalize(text);
  const freq = Object.fromEntries(ALPHA.split('').map(c => [c, 0]));
  for (const ch of t) freq[ch]++;
  const total = t.length || 1;
  return ALPHA.split('').map(c => ({ letter: c, count: freq[c], pct: freq[c] / total }));
}

// ── Index of Coincidence ──
function indexOfCoincidence(text) {
  const t = normalize(text);
  const n = t.length;
  if (n < 2) return 0;
  const freq = letterFrequency(text);
  const sum  = freq.reduce((a, { count: f }) => a + f * (f - 1), 0);
  return sum / (n * (n - 1));
}

// ── Kasiski: find repeated trigrams and their distances ──
function kasiskiTrigrams(text) {
  const t = normalize(text);
  const seen = {};
  for (let i = 0; i <= t.length - 3; i++) {
    const tri = t.slice(i, i + 3);
    if (!seen[tri]) seen[tri] = [];
    seen[tri].push(i);
  }
  // Keep only those appearing ≥ 2 times
  const result = [];
  for (const [tri, positions] of Object.entries(seen)) {
    if (positions.length < 2) continue;
    const distances = [];
    for (let i = 1; i < positions.length; i++) {
      distances.push(positions[i] - positions[0]);
    }
    result.push({ tri, positions, distances });
  }
  return result.sort((a, b) => b.positions.length - a.positions.length);
}

// ── GCD ──
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

function gcdList(nums) {
  return nums.reduce((a, b) => gcd(a, b));
}

// ── Split ciphertext into columns by key length ──
function splitColumns(text, keyLen) {
  const t = normalize(text);
  const cols = Array.from({ length: keyLen }, () => '');
  for (let i = 0; i < t.length; i++) {
    cols[i % keyLen] += t[i];
  }
  return cols;
}

// ── Guess shift by frequency (most frequent letter assumed to be E) ──
function guessShift(columnText) {
  const freq = letterFrequency(columnText);
  const dominant = freq.reduce((a, b) => (a.count > b.count ? a : b));
  return (ALPHA.indexOf(dominant.letter) - ALPHA.indexOf('E') + 26) % 26;
}

// ── English letter frequency reference ──
const EN_FREQ = {
  A:0.082,B:0.015,C:0.028,D:0.043,E:0.127,F:0.022,G:0.020,
  H:0.061,I:0.070,J:0.002,K:0.008,L:0.040,M:0.024,N:0.067,
  O:0.075,P:0.019,Q:0.001,R:0.060,S:0.063,T:0.091,U:0.028,
  V:0.010,W:0.023,X:0.001,Y:0.020,Z:0.001
};

export {
  ALPHA, normalize, encrypt, decrypt, encryptSteps,
  letterFrequency, indexOfCoincidence, kasiskiTrigrams,
  gcd, gcdList, splitColumns, guessShift, EN_FREQ
};
