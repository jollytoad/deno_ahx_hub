import { proxiedUrl } from "../proxied_url.ts";
import type { AugmentationProps } from "../types.ts";

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
        class="aug-check"
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
      const response = await fetch(
        new URL(proxiedUrl(path, id, url), req?.url),
        {
          headers: {
            "Accept": "text/css",
          },
        },
      );
      status = response.statusText;
      className = response.ok ? "ok" : "bad";
    } catch (e) {
      status = "Error";
      className = "bad";
      console.log(e);
    }
    return (
      <span id={docId} class={`aug-check chip ${className}`}>{status}</span>
    );
  }
}
