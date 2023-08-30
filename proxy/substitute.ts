import { parseMediaType } from "$std/media_types/parse_media_type.ts";
import { replaceBody } from "$http_fns/response/replace_body.ts";
import { badGateway } from "$http_fns/response/bad_gateway.ts";

export async function substituteResponse(
  res: Response,
  vars: Record<string, string>,
): Promise<Response> {
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
      const rawContent = await res.text();
      const subContent = substitute(rawContent, vars);
      return replaceBody(res, subContent);
    }
    default:
      return res;
  }
}

function substitute(content: string, vars: Record<string, string>): string {
  return content.replaceAll(
    /(?<delim>[%_])([A-Z_]+)\k<delim>/g,
    (match, _, key) => {
      return vars[key] ?? match;
    },
  );
}
