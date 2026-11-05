import { crc32, deflateSync } from "node:zlib";

/** Decoded pixels in one of pdf.js's `ImageKind` layouts. */
export type DecodedImage = { width: number; height: number; kind: number; data: Uint8Array };

// pdf.js ImageKind → PNG bit depth, color type, and bits per pixel.
// pdf.js packs 1-bit images MSB-first with 1 meaning white, the same as a 1-bit grayscale PNG.
const LAYOUTS: Record<number, { bitDepth: number; colorType: number; bitsPerPixel: number }> = {
  1: { bitDepth: 1, colorType: 0, bitsPerPixel: 1 },
  2: { bitDepth: 8, colorType: 2, bitsPerPixel: 24 },
  3: { bitDepth: 8, colorType: 6, bitsPerPixel: 32 },
};

/** Encodes decoded pixels as a PNG, or returns null for a layout PNG can't hold as-is. */
export function encodePng(image: DecodedImage): Uint8Array | null {
  const layout = LAYOUTS[image.kind];
  if (!layout || image.width <= 0 || image.height <= 0) {
    return null;
  }
  const rowBytes = Math.ceil((image.width * layout.bitsPerPixel) / 8);
  if (image.data.length < rowBytes * image.height) {
    return null;
  }

  const rows = Buffer.alloc((rowBytes + 1) * image.height);
  for (let row = 0; row < image.height; row++) {
    rows.set(
      image.data.subarray(row * rowBytes, (row + 1) * rowBytes),
      row * (rowBytes + 1) + 1,
    );
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(image.width, 0);
  header.writeUInt32BE(image.height, 4);
  header[8] = layout.bitDepth;
  header[9] = layout.colorType;

  return new Uint8Array(
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", header),
      chunk("IDAT", deflateSync(rows)),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}

function chunk(type: string, data: Buffer): Buffer {
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}
