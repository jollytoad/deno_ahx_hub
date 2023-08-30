import type { Augmentation } from "./types.ts";
import { proxiedUrl } from "./proxied_url.ts";

/**
 * Generate a `@import' or `--css-rule-import-*` for an augmentation.
 *
 * @param asRuleProp as `@import` does support cross-origin, this allows use of `--css-rule-import` instead.
 */
export const asCssImport =
  (path: string, asRuleProp = false) =>
  ({ id, url, enable }: Augmentation): string => {
    if (enable) {
      try {
        const urlFn = `url("${encodeURI(proxiedUrl(path, id, url))}")`;
        return asRuleProp
          ? `  --css-rule-import-ahx-${id}: ${urlFn};\n`
          : `@import ${urlFn};\n`;
      } catch (e) {
        console.error(e);
      }
    }
    return "";
  };
