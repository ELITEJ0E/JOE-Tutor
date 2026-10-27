// Zero-dependency PWA icon builder. Run before Vite to create crisp PNG icons.
// Uses only built-in Node APIs so Vercel can build without new packages.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const table = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let i = 0; i < 8; i++) crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  return crc >>> 0;
});
function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) value = table[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
function chunk(name, data) {
  const label = Buffer.from(name);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const check = Buffer.alloc(4);
  check.writeUInt32BE(crc32(Buffer.concat([label, data])));
  return Buffer.concat([size, label, data, check]);
}
function insideCircle(x, y, cx, cy, radius) {
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}
function icon(size) {
  const scanline = size * 4 + 1;
  const pixels = Buffer.alloc(size * scanline);
  for (let y = 0; y < size; y++) {
    pixels[y * scanline] = 0;
    for (let x = 0; x < size; x++) {
      const px = x / size;
      const py = y / size;
      const base = y * scanline + 1 + x * 4;
      // Pastel rose background with a subtly brighter top left.
      const shade = (px + py) / 2;
      let red = Math.round(255 - shade * 25);
      let green = Math.round(228 - shade * 44);
      let blue = Math.round(239 - shade * 22);
      if (insideCircle(px, py, .5, .5, .327)) {
        red = 255; green = 250; blue = 253;
      }
      // A clear, readable magenta J on the center badge.
      const vertical = px > .56 && px < .665 && py > .315 && py < .64;
      const bowlOuter = insideCircle(px, py, .48, .63, .185);
      const bowlInner = insideCircle(px, py, .48, .63, .092);
      const lowerJ = bowlOuter && !bowlInner && py >= .625 && px < .67;
      if (vertical || lowerJ) {
        red = 184; green = 39; blue = 101;
      }
      // Decorative sparkle above the badge.
      const dx = Math.abs(px - .745);
      const dy = Math.abs(py - .252);
      if (dx + dy * 1.1 < .051 || insideCircle(px, py, .247, .322, .021)) {
        red = 227; green = 72; blue = 132;
      }
      pixels[base] = red;
      pixels[base + 1] = green;
      pixels[base + 2] = blue;
      pixels[base + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(pixels, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.mkdirSync(path.join(process.cwd(), 'public'), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), 'public', size === 180 ? 'apple-touch-icon.png' : `pwa-icon-${size}.png`), png);
}
[192, 512, 180].forEach(icon);
console.log('PWA app icons generated.');
