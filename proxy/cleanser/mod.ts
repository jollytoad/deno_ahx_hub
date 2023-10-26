import { parseMediaType } from "$std/media_types/parse_media_type.ts";
import { badGateway } from "$http_fns/response/bad_gateway.ts";
import html from "./html_rewriter.ts";
import css from "./css.ts";

export type Cleanser = (
  res: Response,
  prefix: string,
  mediaType: string,
  params: Record<string, string>,
) => Response | Promise<Response>;

export const defaultCleansers: Record<string, Cleanser | boolean> = {
  "text/html": html(),
  "text/css": css(),
  "text/plain": true,
  "application/json": true,
};

export function cleanseResponse(
  res: Response,
  prefix: string,
  cleansers: Record<string, Cleanser | boolean> = defaultCleansers,
): Response | Promise<Response> {
  if (res.body === null) {
    return res;
  }

  const contentType = res.headers.get("content-type");

  if (!contentType) {
    return badGateway(`No Content-Type in response from: ${res.url}`);
  }

  const [mediaType, params] = parseMediaType(contentType);

  const cleanser: Cleanser | boolean | undefined = cleansers[mediaType];

  if (cleanser === true) {
    return res;
  }

  if (cleanser) {
    return cleanser(res, prefix, mediaType, params ?? {});
  }

  return badGateway(
    `Content-Type '${mediaType}' not supported, from: ${res.url}`,
  );
}
