import sharp from "sharp";

/**
 * Fetch a remote logo and return the average luminance (0-255) of its
 * *opaque* pixels. Transparent regions are ignored so a dark logo on a
 * transparent background reads as "dark", not "neutral".
 *
 * Returns `null` on any failure (missing URL, HTTP error, unsupported
 * format, fully-transparent image) so callers can fall back to their
 * preferred default header variant.
 *
 * Used by the PDF export route to pick the right header variant:
 *   brightness  > 128 → light logo  → use dark  header (white text)
 *   brightness <= 128 → dark  logo  → use light header (dark  text)
 */
export async function getLogoBrightness(
  url: string | null | undefined
): Promise<number | null> {
  if (!url) return null;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Resize down to a small square so the per-pixel loop is cheap regardless
    // of the original logo size. Sharp rasterises SVG inputs automatically.
    const { data, info } = await sharp(buffer)
      .resize(32, 32, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    if (channels < 4) return null; // ensureAlpha should guarantee RGBA

    let totalLuminance = 0;
    let opaqueCount = 0;

    const pixelCount = width * height;
    for (let i = 0; i < pixelCount; i++) {
      const offset = i * channels;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const a = data[offset + 3];

      // Skip effectively-transparent pixels — they'd bias the average toward
      // black since raw RGBA reports r=g=b=0 for fully-transparent regions.
      if (a < 32) continue;

      // Rec. 709 luminance formula — the perceptual brightness weighting
      // used by most modern image tooling.
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      totalLuminance += lum;
      opaqueCount++;
    }

    if (opaqueCount === 0) return null;
    return totalLuminance / opaqueCount;
  } catch {
    return null;
  }
}
