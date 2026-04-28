// ============================================================================
// EXACT PORT OF sha256.lua — Using BigInt to match Lua 5.4's 64-bit integer math
// Lua 5.4 uses 64-bit integers, so intermediate results before & 0xFFFFFFFF
// are 64-bit, which changes overflow behavior compared to JS 32-bit bitwise ops
// ============================================================================

const B = BigInt;
const MASK = B(0xFFFFFFFF);

function rrotate(n, b) {
    n = n & MASK;
    const l = 32 - b;
    let m = B(0);
    if (l < 32) m = (B(1) << B(l)) - B(1);
    return ((n >> B(b)) | ((n & m) << B(l))) & MASK;
}

function preproc(msg) {
    const len = msg.length;
    const extra = 64 - ((len + 9) % 64);
    const len_with_extra = len + 1 + extra + 8;
    const n_blocks = len_with_extra / 64;
    const blocks = [];

    for (let i = 0; i < n_blocks; i++) {
        const block = [];
        for (let j = 0; j < 64; j++) {
            const pos = i * 64 + j;
            if (pos < len) {
                block.push(msg.charCodeAt(pos));
            } else if (pos === len) {
                block.push(0x80);
            } else if (pos >= (len_with_extra - 8)) {
                const byte_idx = pos - (len_with_extra - 8);
                // Lua: ((len * 8) >> ((7 - byte_idx) * 8)) & 0xFF
                // len*8 fits in 64-bit integer in Lua
                const bitLen = BigInt(len) * B(8);
                const shift = (7 - byte_idx) * 8;
                block.push(Number((bitLen >> B(shift)) & B(0xFF)));
            } else {
                block.push(0);
            }
        }
        blocks.push(block);
    }
    return blocks;
}

function digest(msg) {
    let h = [
        B(0x6a09e667), B(0xbb67ae85), B(0x3c6ef372), B(0xa54ff53a),
        B(0x510e527f), B(0x9b05688c), B(0x1f83d9ab), B(0x5be0cd19)
    ];

    const k = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ].map(B);

    const blocks = preproc(msg);

    for (const block of blocks) {
        const w = [];
        for (let i = 0; i < 16; i++) {
            w.push((B(block[i*4]) << B(24)) | (B(block[i*4+1]) << B(16)) | (B(block[i*4+2]) << B(8)) | B(block[i*4+3]));
        }
        for (let i = 16; i < 64; i++) {
            const s0 = rrotate(w[i-15], 7) ^ rrotate(w[i-15], 18) ^ ((w[i-15] & MASK) >> B(3));
            const s1 = rrotate(w[i-2], 17) ^ rrotate(w[i-2], 19) ^ ((w[i-2] & MASK) >> B(10));
            w.push((w[i-16] + s0 + w[i-7] + s1) & MASK);
        }

        let a = h[0], b = h[1], c = h[2], d = h[3];
        let e = h[4], f = h[5], g = h[6], h_val = h[7];

        for (let i = 0; i < 64; i++) {
            const s1 = rrotate(e, 6) ^ rrotate(e, 11) ^ rrotate(e, 25);
            const ch = (e & f) ^ ((~e & MASK) & g);
            const temp1 = (h_val + s1 + ch + k[i] + w[i]) & MASK;
            const s0 = rrotate(a, 2) ^ rrotate(a, 13) ^ rrotate(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (s0 + maj) & MASK;

            h_val = g;
            g = f;
            f = e;
            e = (d + temp1) & MASK;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) & MASK;
        }

        h[0] = (h[0] + a) & MASK;
        h[1] = (h[1] + b) & MASK;
        h[2] = (h[2] + c) & MASK;
        h[3] = (h[3] + d) & MASK;
        h[4] = (h[4] + e) & MASK;
        h[5] = (h[5] + f) & MASK;
        h[6] = (h[6] + g) & MASK;
        h[7] = (h[7] + h_val) & MASK;
    }

    return h.map(v => v.toString(16).padStart(8, '0')).join('');
}

module.exports = { sha256: digest };
