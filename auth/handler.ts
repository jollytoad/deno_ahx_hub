import { byPattern } from "$http_fns/pattern.ts";
import { byMethod } from "$http_fns/method.ts";
import { mapData } from "$http_fns/map.ts";
import { cascade } from "$http_fns/cascade.ts";
import { badRequest } from "$http_fns/response/bad_request.ts";
import { notFound } from "$http_fns/response/not_found.ts";
import {
  getOAuth2ClientFn,
  getOAuth2ClientScope,
  type OAuth2Client,
} from "./oauth2_clients.ts";
import { signIn } from "$deno_kv_oauth/sign_in.ts";
import { handleCallback } from "$deno_kv_oauth/handle_callback.ts";
import { signOut } from "$deno_kv_oauth/sign_out.ts";
import { renderHTML } from "$http_render_fns/render_html.tsx";
import { UserWidget } from "./components/UserWidget.tsx";
import { getTokens } from "$deno_kv_oauth/core.ts";
import { deleteClaims, setClaims } from "./claims.ts";
import { getSessionId } from "$deno_kv_oauth/get_session_id.ts";
import { getIdTokenVerifierFn } from "./verify.ts";

export default cascade(
  byPattern(
    "/-/auth/signout",
    byMethod({
      GET: async (req) => {
        const sessionId = getSessionId(req);
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
      GET: mapData(asOAuth2Client, signIn),
    }),
  ),
  byPattern(
    "/-/auth/:provider/callback",
    byMethod({
      GET: mapData(asOAuth2Client, async (req, oauth2Client) => {
        const { response, sessionId } = await handleCallback(
          req,
          oauth2Client,
        );

        const tokens = await getTokens(sessionId);

        if (tokens?.idToken) {
          const verifier = getIdTokenVerifierFn(oauth2Client.provider);
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

async function asOAuth2Client(
  req: Request,
  match: URLPatternResult,
): Promise<OAuth2Client> {
  const provider = match.pathname.groups.provider;

  if (!provider) {
    throw badRequest();
  }

  const createOAuth2Client = getOAuth2ClientFn(provider);

  if (!createOAuth2Client) {
    throw notFound();
  }

  const redirectUri = new URL("callback", req.url).href;
  const scope = await getOAuth2ClientScope(provider);

  return createOAuth2Client({
    redirectUri,
    defaults: {
      scope,
    },
  });
}
