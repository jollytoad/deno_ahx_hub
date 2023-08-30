import { load } from "$std/dotenv/mod.ts";
import init from "$http_fns/hosting/localhost.ts";
import handler from "../handler.ts";
import { cors } from "$http_fns/cors.ts";

await load({ export: true });

await Deno.serve(await init(handler, { response: [cors()] })).finished;
