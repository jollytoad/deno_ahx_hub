// import { join } from "$std/path/join.ts";
// import { DenoDir } from "https://deno.land/x/deno_cache@0.6.2/deno_dir.ts";
// import { DiskCache } from "https://deno.land/x/deno_cache@0.6.2/disk_cache.ts";
import { importText } from "https://deno.land/x/import_content@v1.0.0/mod.ts";
import { calculate } from "$std/http/etag.ts";
import { contentType } from "$std/media_types/content_type.ts";
import { notFound } from "$http_fns/response/not_found.ts";
import { conditional } from "$http_fns/response/conditional.ts";
import { extname } from "$std/path/extname.ts";
import { ok } from "$http_fns/response/ok.ts";

// let cacheDir: string;

// export async function getCachedFilepath(specifier: string) {
//   if (specifier.startsWith("file:")) {
//     return specifier;
//   }

//   if (!cacheDir) {
//     cacheDir = new DenoDir().createGenCache().location;
//   }

//   const filename = await DiskCache.getCacheFilename(new URL(specifier));

//   const filepath = join(cacheDir, filename);

//   console.log("filepath", filepath);

//   return filepath;
// }

const fileCache = new Map<string, Promise<Response>>();

export async function handleGetFile(req: Request, info: URLPatternResult) {
  const filepath = info.pathname.groups.file;

  if (!filepath) {
    return notFound();
  }

  if (!fileCache.has(filepath)) {
    fileCache.set(filepath, getStatic(filepath));
  }

  const response = await fileCache.get(filepath)!;

  const condResponse = conditional(req, response);

  return condResponse !== response ? condResponse : response.clone();
}

async function getStatic(filepath: string) {
  const content = await importText(import.meta.resolve(`./static/${filepath}`));
  const contentBytes = new TextEncoder().encode(content);
  const headers = new Headers();

  headers.set("last-modified", new Date().toUTCString());

  const contentTypeValue = contentType(extname(filepath));
  if (contentTypeValue) {
    headers.set("content-type", contentTypeValue);
  }

  const etag = await calculate(content);
  if (etag) {
    headers.set("etag", etag);
  }

  headers.set("content-length", `${contentBytes.length}`);

  return ok(contentBytes, headers);
}
