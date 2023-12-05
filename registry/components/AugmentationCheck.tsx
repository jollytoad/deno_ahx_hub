import { proxiedUrl } from "../proxied_url.ts";
import type { AugmentationProps } from "../types.ts";
import proxyHandler from "../../proxy/handler.ts";
import { withFallback } from "$http_fns/with_fallback.ts";

export async function AugmentationCheck(
  props: AugmentationProps & { req?: Request; placeholder?: boolean },
) {
  const { req, regId, path, augmentation, placeholder } = props;
  if (!augmentation) {
    return null;
  }

  const { id, url } = augmentation;
  const docId = `aug-check-${id}`;

  if (placeholder) {
    return (
      <span
        id={docId}
        class="check"
        hx-get={`/${regId}/-/aug/${id}/check`}
        hx-trigger="load"
        hx-swap="outerHTML"
      >
      </span>
    );
  } else {
    let status = "?";
    let className = "";
    try {
      const reqUrl = new URL(proxiedUrl(path, id, url), req?.url);
      const response = await proxyRequest(reqUrl);
      status = response.statusText;
      className = response.ok ? "ok" : "bad";
      response.body?.cancel();
    } catch (e) {
      className = "bad";
      status = "Error";

      if (e instanceof Error) {
        if (e.message.includes("Invalid URL")) {
          status = "Invalid URL";
        }
      }
    }
    return <span id={docId} class={`check chip ${className}`}>{status}</span>;
  }
}

function proxyRequest(url: string | URL) {
  const req = new Request(url, {
    headers: {
      "Accept": "text/css",
    },
  });
  return withFallback(proxyHandler)(req);
}
