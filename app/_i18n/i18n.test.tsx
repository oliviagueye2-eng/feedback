import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fill, plural, rich } from "./format";
import { getDictionary } from "./index";
import { frenchSpaces } from "./typography";

const html = (nodes: React.ReactNode) => renderToStaticMarkup(<>{nodes}</>);

describe("fill", () => {
  it("replaces each {name} by its value and leaves unknown names", () => {
    expect(fill("Continuer avec « {query} » {x}", { query: "mairie" })).toBe("Continuer avec « mairie » {x}");
  });
});

describe("plural", () => {
  const forms = { one: "{count} établissement trouvé", other: "{count} établissements trouvés" };
  it("follows the French rules (0 and 1 are singular)", () => {
    expect(plural(forms, 0)).toBe("0 établissement trouvé");
    expect(plural(forms, 1)).toBe("1 établissement trouvé");
    expect(plural(forms, 6)).toBe("6 établissements trouvés");
  });
});

describe("rich", () => {
  it("shows <b> in bold and keeps the rest as text", () => {
    expect(html(rich("Encore ? <b>Scannez</b>, c'est rempli."))).toBe(
      "Encore ? <strong>Scannez</strong>, c&#x27;est rempli.",
    );
  });

  it("uses the elements given for other tags", () => {
    expect(html(rich("Réessayez, ou <a>saisissez le nom</a>.", { a: (c) => <a href="/x">{c}</a> }))).toBe(
      'Réessayez, ou <a href="/x">saisissez le nom</a>.',
    );
  });

  it("keeps the text of an unknown tag, without the tag", () => {
    expect(html(rich("<i>texte</i> seul"))).toBe("texte seul");
  });
});

describe("frenchSpaces", () => {
  it("puts a non-breaking space before ? ! : ; » and after «", () => {
    expect(frenchSpaces("Ex. : « Fann » ?")).toBe("Ex. : « Fann » ?");
  });
});

describe("getDictionary", () => {
  it("gives the French texts with French typography", async () => {
    const t = await getDictionary("fr");
    expect(t.common.searchLabel).toBe("Dans quel établissement êtes-vous allé(e) ?");
    expect(t.home.steps).toHaveLength(3);
  });
});
