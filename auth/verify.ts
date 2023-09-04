import type { JwtClaims } from "$ahx_fns/authn/types.ts";
import { verifyGoogleToken } from "$ahx_fns/authn/google/verify.ts";

export type IdTokenVerifier<T extends JwtClaims = JwtClaims> = (
  req: Request,
  token: string,
) => Promise<T | undefined>;

// TODO: support for more providers as necessary

export function getIdTokenVerifierFn(provider: string): IdTokenVerifier {
  const providerLower = provider.toLowerCase();

  switch (providerLower) {
    case "google":
      return (req, token) =>
        verifyGoogleToken(req, token, {
          clientId: Deno.env.get("GOOGLE_CLIENT_ID"),
          hostDomain: Deno.env.get("GOOGLE_HOST_DOMAIN") ?? undefined,
        });
    default:
      return () => Promise.resolve(undefined);
  }
}
