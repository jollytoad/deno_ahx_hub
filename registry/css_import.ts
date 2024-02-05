import type { Augmentation } from "./types.ts";
import { proxiedUrl } from "./proxied_url.ts";

/**
 * Generate a `@import' or `--ahx-import` for an augmentation.
 *
 * @param asRuleProp as `@import` does not support cross-origin, this allows use of `--ahx-import` instead.
 */
export const asCssImport =
  (path: string, asRuleProp = false) =>
  ({ id, url, enable }: Augmentation): string => {
    if (enable) {
      try {
        const urlFn = `url("${encodeURI(proxiedUrl(path, id, url))}")`;
        return asRuleProp
          ? `  --ahx-import: ${urlFn};\n`
          : `@import ${urlFn};\n`;
      } catch (e) {
        console.error(e);
      }
    }
    return "";
  };
