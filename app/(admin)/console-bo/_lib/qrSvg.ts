import { qrMatrix, qrUrl } from "@/src/lib/qr";

/** Dark squares on white: read by every phone camera (never light on dark). */
const DARK = "#13261C";
const LIGHT = "#FFFFFF";
/** White border around the code, in squares: 4 is the standard's minimum. */
const MARGIN = 4;

/**
 * The QR code of `code` as an SVG document, one unit per square. No logo in
 * the middle (Olivia's choice, 2026-10-10): the poster already shows it.
 */
export function qrSvg(code: string): string {
  const matrix = qrMatrix(qrUrl(code));
  const full = matrix.length + 2 * MARGIN;
  let squares = "";
  matrix.forEach((cells, row) =>
    cells.forEach((dark, col) => {
      if (dark) squares += `M${col + MARGIN} ${row + MARGIN}h1v1h-1z`;
    }),
  );
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${full} ${full}" shape-rendering="crispEdges">` +
    `<rect width="${full}" height="${full}" fill="${LIGHT}"/>` +
    `<path fill="${DARK}" d="${squares}"/>` +
    `</svg>`
  );
}
