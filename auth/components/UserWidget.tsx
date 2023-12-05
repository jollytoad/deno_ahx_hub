import { getSessionId } from "$deno_kv_oauth/get_session_id.ts";
import { getClaims, type IdClaims } from "../claims.ts";
import { getOAuthClientNames, hasOAuthClientEnvVars } from "../oauth_config.ts";

interface Props {
  req?: Request;
}

export async function UserWidget({ req }: Props) {
  if (!req) {
    return null;
  }

  const sessionId = await getSessionId(req);

  if (sessionId) {
    const claims = await getClaims(sessionId) ?? undefined;
    return <SignedIn claims={claims} />;
  } else {
    const providers = await getProviders();
    return <SignedOut providers={providers} />;
  }
}

function SignedIn({ claims }: { claims?: IdClaims }) {
  return (
    <div class="user-widget signed-in">
      <a href="/-/auth/signout" title={claims?.email ?? "unknown"}>Sign Out</a>
    </div>
  );
}

function SignedOut({ providers }: { providers: Provider[] }) {
  switch (providers.length) {
    case 0:
      return null;
    case 1:
      return (
        <div class="user-widget signed-out">
          <a
            href={`/-/auth/${providers[0].id}/signin`}
            title={`Sign in with ${providers[0].name}`}
          >
            Sign In
          </a>
        </div>
      );
    default:
      return (
        <div class="user-widget signed-out">
          <span class="signin-header">Sign In with...</span>
          <span class="signin-menu">
            {providers.map((provider) => (
              <a
                href={`/-/auth/${provider.id}/signin`}
                title={`Sign in with ${provider.name}`}
              >
                {provider.name}
              </a>
            ))}
          </span>
        </div>
      );
  }
}

interface Provider {
  id: string;
  name: string;
}

async function getProviders(): Promise<Provider[]> {
  return (await Promise.all(
    getOAuthClientNames().map(async (name) => {
      if (await hasOAuthClientEnvVars(name)) {
        return {
          id: name.toLowerCase(),
          name,
        };
      }
    }),
  )).filter((v): v is Provider => !!v);
}
