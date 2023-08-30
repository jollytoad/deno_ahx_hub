import { handle } from "$http_fns/handle.ts";
import { staticRoute } from "$http_fns/static.ts";
import registry from "./registry/handler.ts";
import proxy from "./proxy/handler.ts";

export default handle([
  staticRoute("/static", import.meta.resolve("./static")),
  registry,
  proxy,
]);
