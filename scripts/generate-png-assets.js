const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// Simple pure JS PNG generator using node's built-in zlib
function createPng(width, height, getPixel) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // CRC32 implementation
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(buf.slice(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression: Deflate
  ihdr[11] = 0; // Filter: Adaptive
  ihdr[12] = 0; // Interlace: None
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT Chunk
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Brand color palette
// Charcoal: #1C1A18 -> (28, 26, 24)
// Gold: #B99A68 -> (185, 154, 104)
// Light Gold: #E5CAA2 -> (229, 202, 162)
// Deep Charcoal: #12100E -> (18, 16, 14)

function luxuryIconShader(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = (x - cx) / (w / 2);
  const dy = (y - cy) / (h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Radial luxury charcoal background with gold rim
  let r = 28, g = 26, b = 24, a = 255;
  const vign = Math.min(1, dist * 0.8);
  r = Math.round(28 * (1 - vign * 0.4));
  g = Math.round(26 * (1 - vign * 0.4));
  b = Math.round(24 * (1 - vign * 0.4));

  // Gold border ring at 0.88 - 0.92
  if (dist >= 0.88 && dist <= 0.93) {
    return [185, 154, 104, 255];
  }
  if (dist >= 0.85 && dist <= 0.86) {
    return [229, 202, 162, 200];
  }

  // Diamond emblem in center (abs(dx) + abs(dy) < 0.6)
  const diamondDist = Math.abs(dx) + Math.abs(dy);
  if (Math.abs(diamondDist - 0.55) < 0.02) {
    return [185, 154, 104, 255];
  }

  // Monogram area S & F geometry in center
  // Center horizontal crossbar
  if (Math.abs(dy) < 0.04 && Math.abs(dx) < 0.28) {
    return [229, 202, 162, 255];
  }
  // Center vertical stem
  if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.32) {
    return [185, 154, 104, 255];
  }
  // Upper S curve
  if (dy > -0.32 && dy < -0.15 && dx > -0.25 && dx < 0.05) {
    if (Math.abs(dy - (-0.3)) < 0.04 || Math.abs(dx - (-0.22)) < 0.04) {
      return [229, 202, 162, 255];
    }
  }
  // Lower S curve
  if (dy > 0.05 && dy < 0.28 && dx > -0.05 && dx < 0.25) {
    if (Math.abs(dy - 0.25) < 0.04 || Math.abs(dx - 0.22) < 0.04) {
      return [229, 202, 162, 255];
    }
  }
  // Crown top jewels
  if (dy > -0.48 && dy < -0.42 && Math.abs(dx) < 0.15) {
    return [229, 202, 162, 255];
  }

  return [r, g, b, a];
}

const brandingDir = path.join(__dirname, '..', 'public', 'assets', 'branding');
if (!fs.existsSync(brandingDir)) {
  fs.mkdirSync(brandingDir, { recursive: true });
}

console.log('Generating high-res PNG branding assets...');
const png192 = createPng(192, 192, luxuryIconShader);
const png512 = createPng(512, 512, luxuryIconShader);

fs.writeFileSync(path.join(brandingDir, 'app-dp.png'), png512);
fs.writeFileSync(path.join(brandingDir, 'icon-192x192.png'), png192);
fs.writeFileSync(path.join(brandingDir, 'icon-512x512.png'), png512);
fs.writeFileSync(path.join(brandingDir, 'android-launcher-icon.png'), png192);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'icon-192.png'), png192);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'icon-512.png'), png512);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), createPng(32, 32, luxuryIconShader));

console.log('PNG assets successfully generated!');
