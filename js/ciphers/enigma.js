// Enigma Machine simulator — Enigma I (Wehrmacht/Luftwaffe)
// Rotors: I–V, Reflectors: B, C

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Historical rotor wirings (right→left)
const ROTORS = {
  I:   { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q' },
  II:  { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E' },
  III: { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V' },
  IV:  { wiring: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notch: 'J' },
  V:   { wiring: 'VZBRGITYUPSDNHLXAWMJQOFECK', notch: 'Z' },
};

const REFLECTORS = {
  B: 'YRUHQSLDPXNGOKMIEBFZCWVJAT',
  C: 'FVPJIAOYEDRZXWGCTKUQSBNMHL',
};

// Build reverse wiring (left→right) for a rotor
function reverseWiring(wiring) {
  const rev = Array(26);
  for (let i = 0; i < 26; i++) {
    rev[ALPHA.indexOf(wiring[i])] = ALPHA[i];
  }
  return rev.join('');
}

// Encode one letter through a rotor (forward direction)
function rotorEncode(letter, wiring, offset, ringOffset = 0) {
  const i = (ALPHA.indexOf(letter) + offset - ringOffset + 26) % 26;
  const out = wiring[i];
  return ALPHA[(ALPHA.indexOf(out) - offset + ringOffset + 26) % 26];
}

// Full Enigma state
class EnigmaMachine {
  constructor(rotorNames = ['I','II','III'], reflectorName = 'B',
              startPositions = [0,0,0], ringSettings = [0,0,0],
              plugboardPairs = []) {
    this.rotorDefs = rotorNames.map(n => ROTORS[n]);
    this.reflector = REFLECTORS[reflectorName];
    this.positions = [...startPositions]; // 0=left, 1=mid, 2=right
    this.rings = [...ringSettings];
    this.plugboard = buildPlugboard(plugboardPairs);
  }

  // Step rotors (double-stepping anomaly included)
  step() {
    const notches = this.rotorDefs.map(r => r.notch);
    const pos = this.positions;
    // Double stepping
    const midAtNotch   = ALPHA[pos[1]] === notches[1];
    const rightAtNotch = ALPHA[pos[2]] === notches[2];
    if (midAtNotch) {
      pos[0] = (pos[0] + 1) % 26;
      pos[1] = (pos[1] + 1) % 26;
    }
    if (rightAtNotch) {
      pos[2] = (pos[2] + 1) % 26;
      if (!midAtNotch) pos[1] = (pos[1] + 1) % 26;
    } else {
      pos[2] = (pos[2] + 1) % 26;
    }
  }

  // Encode one letter, returns {output, path} for visualization
  encodeLetter(letter) {
    letter = letter.toUpperCase();
    if (!ALPHA.includes(letter)) return null;

    const path = [];

    // Plugboard in
    const pbIn = this.plugboard[letter] || letter;
    path.push({ stage: 'plugboard_in', in: letter, out: pbIn });

    this.step();

    let ch = pbIn;

    // Right → Left through rotors
    for (let i = 2; i >= 0; i--) {
      const prev = ch;
      const fwd = this.rotorDefs[i].wiring;
      ch = rotorEncode(ch, fwd, this.positions[i], this.rings[i]);
      path.push({ stage: `rotor${i+1}_fwd`, in: prev, out: ch, pos: this.positions[i] });
    }

    // Reflector
    const prevRef = ch;
    const ri = ALPHA.indexOf(ch);
    ch = this.reflector[ri];
    path.push({ stage: 'reflector', in: prevRef, out: ch });

    // Left → Right back through rotors
    for (let i = 0; i <= 2; i++) {
      const prev = ch;
      const rev = reverseWiring(this.rotorDefs[i].wiring);
      ch = rotorEncode(ch, rev, this.positions[i], this.rings[i]);
      path.push({ stage: `rotor${i+1}_rev`, in: prev, out: ch, pos: this.positions[i] });
    }

    // Plugboard out
    const pbOut = this.plugboard[ch] || ch;
    path.push({ stage: 'plugboard_out', in: ch, out: pbOut });

    return { output: pbOut, path, positions: [...this.positions] };
  }

  encodeMessage(msg) {
    return msg.toUpperCase().replace(/[^A-Z]/g,'').split('').map(ch => {
      const r = this.encodeLetter(ch);
      return r ? r.output : ch;
    }).join('');
  }

  getPositions() { return [...this.positions]; }
  setPositions(p) { this.positions = [...p]; }
}

function buildPlugboard(pairs) {
  const pb = {};
  for (const [a, b] of pairs) {
    pb[a.toUpperCase()] = b.toUpperCase();
    pb[b.toUpperCase()] = a.toUpperCase();
  }
  return pb;
}

// ── Bombe simulation ──
// Given a crib (known plaintext) and its position in ciphertext,
// test all starting positions for a given rotor config.
// Returns first 'stop' that satisfies crib constraints.

function bombeSearch(ciphertext, crib, rotorNames = ['I','II','III'],
                     reflectorName = 'B', ringSettings = [0,0,0],
                     plugboardPairs = [], maxTests = 17576, onProgress = null) {
  const ct = ciphertext.toUpperCase().replace(/[^A-Z]/g,'');
  const cb = crib.toUpperCase().replace(/[^A-Z]/g,'');

  const results = [];
  let tested = 0;

  for (let pos = 0; pos < 26*26*26 && tested < maxTests; pos++) {
    const r = Math.floor(pos / 676) % 26;
    const m = Math.floor(pos / 26)  % 26;
    const l = pos % 26;

    const machine = new EnigmaMachine(
      rotorNames, reflectorName,
      [r, m, l], ringSettings, plugboardPairs
    );

    // Test: decode ciphertext and check if it matches the crib
    // (Enigma is symmetric: encode(ct) = pt, so decode(ct[i]) should equal cb[i])
    let valid = true;
    for (let i = 0; i < cb.length && i < ct.length; i++) {
      const result = machine.encodeLetter(ct[i]);
      if (!result || result.output !== cb[i]) {
        valid = false;
        break;
      }
    }

    if (valid) {
      results.push({ positions: [r, m, l], posStr: ALPHA[r]+ALPHA[m]+ALPHA[l] });
    }

    tested++;
    if (onProgress && tested % 200 === 0) onProgress(tested, maxTests, results.length);
  }

  return results;
}

// Check crib drag: find positions in CT where crib placement is not immediately
// invalidated by the self-encryption rule.
function cribDrag(ciphertext, crib) {
  const ct = ciphertext.toUpperCase().replace(/[^A-Z]/g,'');
  const cb = crib.toUpperCase().replace(/[^A-Z]/g,'');
  const possible = [];
  const impossible = [];

  for (let offset = 0; offset + cb.length <= ct.length; offset++) {
    let selfEnc = false;
    for (let i = 0; i < cb.length; i++) {
      if (ct[offset+i] === cb[i]) { selfEnc = true; break; }
    }
    if (selfEnc) impossible.push(offset);
    else possible.push(offset);
  }

  return { possible, impossible };
}

export { EnigmaMachine, bombeSearch, cribDrag, ALPHA, ROTORS, REFLECTORS };
