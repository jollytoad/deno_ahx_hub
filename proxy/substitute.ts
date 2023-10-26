import { parseMediaType } from "$std/media_types/parse_media_type.ts";
import { replaceBody } from "$http_fns/response/replace_body.ts";
import { badGateway } from "$http_fns/response/bad_gateway.ts";
import { SubstitutionStream } from "../lib/SubstitutionStream.ts";

export function substituteResponse(
  res: Response,
  vars: Record<string, string>,
): Response {
  if (res.body === null) {
    return res;
  }

  const contentType = res.headers.get("Content-Type");

  if (!contentType) {
    return badGateway(`No Content-Type in response from: ${res.url}`);
  }

  const [mediaType] = parseMediaType(contentType);

  switch (mediaType) {
    case "text/html":
    case "text/css": {
      const subContent = res.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new SubstitutionStream({ substitute }))
        .pipeThrough(new TextEncoderStream());

      return replaceBody(res, subContent);
    }
    default:
      return res;
  }

  function substitute(key: string) {
    return vars[key];
  }
}
