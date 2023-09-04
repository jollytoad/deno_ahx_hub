import { handle } from "$http_fns/handle.ts";
import auth from "./auth/handler.ts";
import registry from "./registry/handler.ts";
import proxy from "./proxy/handler.ts";

export default handle([
  auth,
  registry,
  proxy,
]);
