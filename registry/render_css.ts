import { ok } from "$http_fns/response/ok.ts";
import type { RegistryProps } from "./types.ts";
import { asCssImport } from "./css_import.ts";

export function renderCSS(
  req: Request,
  { path, augmentations }: RegistryProps,
): Response {
  // If the request has an Origin headers we assume the browser is accessing the
  // registry cross-origin, and so we'll response using `--css-rule-import`s
  // instead of standard CSS `@import` rules, as they would prevent us from
  // analysing the stylesheet in the browser. `@import` lacks the ability to
  // declare `crossorigin`.
  const crossOrigin = req.headers.has("Origin");

  const head = crossOrigin ? ":root {\n" : "";
  const tail = crossOrigin ? "}\n" : "";

  const body = new Blob([
    head,
    ...augmentations.map(asCssImport(path, crossOrigin)),
    tail,
  ]);

  return ok(body, {
    "Content-Type": "text/css; charset=utf-8",
    "Vary": "Origin",
  });
}
