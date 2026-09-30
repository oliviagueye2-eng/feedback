/**
 * French typography: a non-breaking space before ? ! : ; and » and after «,
 * so that the sign never ends up alone at the start or end of a line. Used on
 * the French dictionary when it is loaded, and on texts from the database.
 */
export const frenchSpaces = (text: string) =>
  text.replace(/ ([?!:;»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
