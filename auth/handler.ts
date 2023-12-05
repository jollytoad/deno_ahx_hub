import { byPattern } from "$http_fns/by_pattern.ts";
import { byMethod } from "$http_fns/by_method.ts";
import { mapData } from "$http_fns/map_data.ts";
import { cascade } from "$http_fns/cascade.ts";
import { badRequest } from "$http_fns/response/bad_request.ts";
import { notFound } from "$http_fns/response/not_found.ts";
import {
  getOAuthClientScope,
  getOAuthConfigFn,
  type OAuth2ClientConfig,
} from "./oauth_config.ts";
import { signIn } from "$deno_kv_oauth/sign_in.ts";
import { handleCallback } from "$deno_kv_oauth/handle_callback.ts";
import { signOut } from "$deno_kv_oauth/sign_out.ts";
import { renderHTML } from "$http_render_fns/render_html.tsx";
import { UserWidget } from "./components/UserWidget.tsx";
import { deleteClaims, setClaims } from "./claims.ts";
import { getSessionId } from "$deno_kv_oauth/get_session_id.ts";
import { getIdTokenVerifierFn } from "./verify.ts";

export default cascade(
  byPattern(
    "/-/auth/signout",
    byMethod({
      GET: async (req) => {
        const sessionId = await getSessionId(req);
        if (sessionId) {
          await deleteClaims(sessionId);
        }
        return signOut(req);
      },
    }),
  ),
  byPattern(
    "/-/auth/widget",
    byMethod({
      GET: mapData(
        (req, match) => ({ req, match }),
        renderHTML(UserWidget),
      ),
    }),
  ),
  byPattern(
    "/-/auth/:provider/signin",
    byMethod({
      GET: mapData(asOAuthConfig, signIn),
    }),
  ),
  byPattern(
    "/-/auth/:provider/callback",
    byMethod({
      GET: mapData(asOAuthConfig, async (req, oauthConfig) => {
        const { response, sessionId, tokens } = await handleCallback(
          req,
          oauthConfig,
        );

        if (tokens.idToken) {
          const verifier = getIdTokenVerifierFn(oauthConfig.provider);
          const claims = await verifier(req, tokens.idToken);

          if (claims) {
            console.log(claims);
            await setClaims(sessionId, claims);
          }
        }

        return response;
      }),
    }),
  ),
);

async function asOAuthConfig(
  req: Request,
  match: URLPatternResult,
): Promise<OAuth2ClientConfig & { provider: string }> {
  const provider = match.pathname.groups.provider;

  if (!provider) {
    throw badRequest();
  }

  const createOAuthConfig = getOAuthConfigFn(provider);

  if (!createOAuthConfig) {
    throw notFound();
  }

  const redirectUri = new URL("callback", req.url).href;
  const scope = await getOAuthClientScope(provider);

  return {
    ...createOAuthConfig({
      redirectUri,
      scope,
    }),
    provider,
  };
}
