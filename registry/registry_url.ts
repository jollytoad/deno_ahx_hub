import { BASE_REQ_URL_HEADER } from "$ahx_fns/constants.ts";
import { getUrlHeader } from "$http_fns/request/url_header.ts";

export const getProxiedRegistryUrl = getUrlHeader(BASE_REQ_URL_HEADER);

export function getRegistryPath(req: Request, info: URLPatternResult): string {
  return getProxiedRegistryUrl(req)?.pathname?.replace(/\.\w+$/, "") ??
    `/${info.pathname.groups.regId}`;
}
