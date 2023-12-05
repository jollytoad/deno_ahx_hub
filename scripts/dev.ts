import { load } from "$std/dotenv/mod.ts";
import init from "$http_fns/hosting/init_localhost.ts";
import handler from "../handler.ts";
import { cors } from "$http_fns/cors.ts";

await load({ export: true });

Deno.env.set("DENO_TLS_CA_STORE", "system");

await Deno.serve(await init(handler, { response: [cors()] })).finished;
