import { getSessionId } from "$deno_kv_oauth/get_session_id.ts";
import { isReadonly } from "./store.ts";
import { getClaims, type IdClaims } from "../auth/claims.ts";

export async function canEdit(req: Request, regId: string, _augId?: string) {
  if (await isReadonly(regId)) {
    return false;
  }

  const sessionId = getSessionId(req);
  const claims = sessionId && await getClaims<IdClaims>(sessionId);

  return !!claims;
}
