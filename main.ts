import init from "$http_fns/hosting/init_deploy.ts";
import handler from "./handler.ts";
import { cors } from "$http_fns/cors.ts";

await Deno.serve(await init(handler, { response: [cors()] })).finished;
