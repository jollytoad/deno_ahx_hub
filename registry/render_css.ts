import { ok } from "$http_fns/response/ok.ts";
import type { Augmentation, RegistryProps } from "./types.ts";
import { proxiedUrl } from "./proxied_url.ts";
import { noContent } from "$http_fns/response/no_content.ts";

export function renderCSS(
  req: Request,
  { path, augmentations }: RegistryProps,
): Response {
  const urlFns = augmentations.flatMap(asUrlFn(path));

  if (urlFns.length) {
    // If the request has an Origin headers we assume the browser is accessing the
    // registry cross-origin, and so we'll response using `--ahx-import`s
    // instead of standard CSS `@import` rules, as they would prevent us from
    // analysing the stylesheet in the browser. `@import` lacks the ability to
    // declare `crossorigin`.
    const crossOrigin = req.headers.has("Origin");

    const body = crossOrigin
      ? renderAhxImport(urlFns)
      : renderAtImport(urlFns);

    return ok(body, {
      "Content-Type": "text/css; charset=utf-8",
      "Vary": "Origin",
    });
  } else {
    return noContent();
  }
}

function renderAtImport(urlFns: string[]) {
  return urlFns.map(urlFn => `@import ${urlFn};\n`).join("");
}

function renderAhxImport(urlFns: string[]) {
  return `:root {\n  --ahx-import: ${urlFns.join(" ")};\n}\n`;
}

const asUrlFn = (path: string) => ({id, url, enable}: Augmentation): string[] => {
  if (enable) {
    try {
      return [`url("${encodeURI(proxiedUrl(path, id, url))}")`];
    } catch (e) {
      console.error(e);
    }
  }
  return [];
};
