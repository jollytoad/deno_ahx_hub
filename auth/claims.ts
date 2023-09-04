import type { JwtClaims } from "$ahx_fns/authn/types.ts";
import type { GoogleClaims } from "$ahx_fns/authn/google/types.ts";

export type IdClaims = JwtClaims & GoogleClaims;

const CLAIMS_PREFIX = "claims";

const KV_PATH_KEY = "KV_PATH";
let path = undefined;
if (
  (await Deno.permissions.query({ name: "env", variable: KV_PATH_KEY }))
    .state === "granted"
) {
  path = Deno.env.get(KV_PATH_KEY);
}
const kv = await Deno.openKv(path);

export async function setClaims<T extends JwtClaims>(
  sessionId: string,
  claims: T,
) {
  await kv.set([CLAIMS_PREFIX, sessionId], claims);
}

export async function getClaims<T extends JwtClaims>(sessionId: string) {
  return (await kv.get<T>([CLAIMS_PREFIX, sessionId]))?.value;
}

export async function deleteClaims(sessionId: string) {
  await kv.delete([CLAIMS_PREFIX, sessionId]);
}
