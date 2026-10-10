import { qrMatrix, qrUrl } from "@/src/lib/qr";
import { LOGO_PARTS } from "../../../(public)/_intro/logoParts";

/** Dark squares on white: read by every phone camera (never light on dark). */
const DARK = "#13261C";
const LIGHT = "#FFFFFF";
/** White border around the code, in squares: 4 is the standard's minimum. */
const MARGIN = 4;
/** The logo's box, as a share of the code's width (H correction allows up to about 30 % of damage). */
const LOGO_SHARE = 0.24;
const LOGO_RATIO = 1200 / 1274;

/**
 * The QR code of `code` as an SVG document, one unit per square. With `logo`,
 * the squares under the middle are left out and the NeexNaxari logo drawn there.
 */
export function qrSvg(code: string, { logo = false }: { logo?: boolean } = {}): string {
  const matrix = qrMatrix(qrUrl(code));
  const size = matrix.length;
  const full = size + 2 * MARGIN;

  // The cleared box, centred, a whole number of squares with the same parity as the code (stays centred).
  let box = Math.round(size * LOGO_SHARE);
  if (box % 2 !== size % 2) box += 1;
  const start = (size - box) / 2;
  const cleared = (row: number, col: number) =>
    logo && row >= start && row < start + box && col >= start && col < start + box;

  let squares = "";
  matrix.forEach((cells, row) =>
    cells.forEach((dark, col) => {
      if (dark && !cleared(row, col)) squares += `M${col + MARGIN} ${row + MARGIN}h1v1h-1z`;
    }),
  );

  let mark = "";
  if (logo) {
    // The logo inside the box with half a square of white around it.
    const height = box - 1;
    const width = height * LOGO_RATIO;
    const x = MARGIN + start + (box - width) / 2;
    const y = MARGIN + start + 0.5;
    const scale = height / 1274;
    mark =
      `<g shape-rendering="auto" transform="translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${scale.toFixed(5)})">` +
      LOGO_PARTS.map((part) => `<path fill="${part.fill}" d="${part.d}"/>`).join("") +
      `</g>`;
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${full} ${full}" shape-rendering="crispEdges">` +
    `<rect width="${full}" height="${full}" fill="${LIGHT}"/>` +
    `<path fill="${DARK}" d="${squares}"/>` +
    mark +
    `</svg>`
  );
}
