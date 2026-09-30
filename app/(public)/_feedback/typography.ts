/**
 * French typography for texts coming from the database: a non-breaking space
 * before ? ! : ; so that the sign never ends up alone at the start of a line.
 */
export const frenchSpaces = (text: string) => text.replace(/ ([?!:;])/g, " $1");
