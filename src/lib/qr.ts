/**
 * QR codes printed in establishments (asked by Olivia, 2026-10-10). The code
 * leads to /e/{code} on the main domain: the address printed stays valid after
 * the launch, whatever the test address.
 */
import { randomInt } from "node:crypto";
import QRCode from "qrcode";

export const QR_SITE = "neexnaqari.com";

/** No 0, O, 1, I or L: the code printed under the QR code can be typed without doubt. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const QR_CODE_LENGTH = 8;

/** A new random code: 31^8 possibilities, so a repeat is very unlikely (the database refuses it anyway). */
export function newQrCode(): string {
  return Array.from({ length: QR_CODE_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

/** A code typed by hand: lower case accepted, spaces ignored. */
export function normalizeQrCode(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
}

/** The address held by the QR code. */
export const qrUrl = (code: string) => `https://${QR_SITE}/e/${code}`;

/**
 * The dark squares of the QR code, row by row. Error correction H: up to 30 %
 * of the code can be damaged (a dirty poster, or the logo in the middle).
 */
export function qrMatrix(text: string): boolean[][] {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "H" });
  return Array.from({ length: modules.size }, (_, row) =>
    Array.from({ length: modules.size }, (_, col) => modules.get(row, col) === 1),
  );
}
