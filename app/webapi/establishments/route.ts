import { createUserEstablishment, searchEstablishments } from "@/src/domain/establishment";
import { readJson, respond } from "../_lib/respond";

/** GET /webapi/establishments?q=etat+civil (autocomplete, screen 0a) */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return respond(() => searchEstablishments(query));
}

/** POST /webapi/establishments (establishment typed by the user, screen 0c) */
export async function POST(request: Request) {
  return respond(async () => createUserEstablishment(await readJson(request)));
}
