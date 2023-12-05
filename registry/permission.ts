import { getSessionId } from "$deno_kv_oauth/get_session_id.ts";
import { isReadonly } from "./store.ts";
import { getClaims, type IdClaims } from "../auth/claims.ts";

export async function canEdit(req: Request, regId: string) {
  if (await isReadonly(regId)) {
    return false;
  }

  try {
    if (Deno.env.get("ANON_EDIT") === "true") {
      return true;
    }
  } catch {
    // Env permission error
  }

  const sessionId = await getSessionId(req);
  const claims = sessionId && await getClaims<IdClaims>(sessionId);

  if (claims) {
    return true;
  }

  try {
    const registrarToken = Deno.env.get("REGISTRAR_TOKEN");

    if (registrarToken) {
      const auth = req.headers.get("Authorization");

      if (auth === `Bearer ${registrarToken}`) {
        return true;
      }
    }
  } catch {
    // Env permission error
  }

  return false;
}
