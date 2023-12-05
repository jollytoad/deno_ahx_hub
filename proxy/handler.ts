import { byPattern } from "$http_fns/by_pattern.ts";
import { getAugmentation } from "../registry/store.ts";
import { cleanseResponse } from "./cleanser/mod.ts";
import { substituteResponse } from "./substitute.ts";
import {
  AUGMENTATION_ID_HEADER,
  AUGMENTATION_PREFIX,
  BASE_REQ_URL_HEADER,
  NAV_URL_HEADER,
  REGISTRY_ID_HEADER,
  REQ_URL_HEADER,
} from "$ahx_fns/constants.ts";
import { getUrlHeader } from "$http_fns/request/url_header.ts";
import {
  isInformationalStatus,
  isRedirectStatus,
  STATUS_CODE,
} from "$std/http/status.ts";
import { getCookieToken } from "$ahx_fns/authn/client/cookie.ts";
import { ok } from "$http_fns/response/ok.ts";
import { notFound } from "$http_fns/response/not_found.ts";
import { replaceBody } from "$http_fns/response/replace_body.ts";
import { appendHeaders } from "$http_fns/response/append_headers.ts";
import { badGateway } from "$http_fns/response/bad_gateway.ts";

export default byPattern(
  ["/:regId/:augId", "/:regId/:augId/*"],
  async (req, info) => {
    if (req.method === "OPTIONS") {
      return ok();
    }

    const { regId, augId, 0: path } = info.pathname.groups;

    if (!regId || !augId) {
      return notFound();
    }

    const augmentation = await getAugmentation(regId, augId);

    if (augmentation) {
      const url = new URL(path || ".", augmentation.url);
      if (path === undefined && url.pathname.endsWith("/")) {
        url.pathname = url.pathname.slice(0, -1);
      }
      url.search = info.search.input;

      const { reqURL, navURL } = getAugUrls(req, regId, augId);

      const headers = new Headers(req.headers);

      headers.set(REGISTRY_ID_HEADER, regId);
      headers.set(AUGMENTATION_ID_HEADER, augId);
      headers.set(REQ_URL_HEADER, reqURL.href);
      if (navURL) {
        headers.set(NAV_URL_HEADER, navURL.href);
      }
      if (!headers.has("Upgrade")) {
        headers.delete("Origin");
      }

      // Set the Authorization header to the ahx_token cookie if present
      if (!headers.has("Authorization") && headers.has("Cookie")) {
        const token = getCookieToken(req);
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }

      headers.delete("Cookie");

      // TODO: Remove other potentially sensitive headers

      const { method, body } = req;

      let response!: Response;

      try {
        response = await fetch(url, {
          method,
          headers,
          body,
          redirect: "manual",
        });
      } catch (e: unknown) {
        console.error(`Proxy request failed: ${req.url}`);
        const message = e instanceof Error ? e.message : "proxy request failed";
        return badGateway(message);
      }

      if (response.status === 101) {
        console.log("WEBSOCKET!");
        return response;
      }

      if (
        isInformationalStatus(response.status) ||
        isRedirectStatus(response.status)
      ) {
        return response;
      }

      if (isNoContentStatus(response.status)) {
        return response.body ? replaceBody(response, null) : response;
      }

      response = substituteResponse(response, {
        // NOTE: The commented out vars are currently unused in practice but may be
        // added if required.
        ID: `${AUGMENTATION_PREFIX}${augId}`,
        AUG_ID: augId,
        REG_ID: regId,
        REQ_URL: reqURL.href,
        REQ_PATH: reqURL.pathname,
        NAV_URL: (navURL ?? reqURL).href,
        NAV_PATH: (navURL ?? reqURL).pathname,
      });

      response = await cleanseResponse(
        response,
        `${AUGMENTATION_PREFIX}${augId}-`,
      );

      response = appendHeaders(response, {
        [REGISTRY_ID_HEADER]: regId,
        [AUGMENTATION_ID_HEADER]: augId,
      });

      return response;
    } else {
      return notFound();
    }
  },
);

export interface AugUrls {
  reqURL: URL;
  navURL?: URL;
}

export function getAugUrls(
  req: Request,
  regId: string,
  augId: string,
): AugUrls {
  const baseReqURL = getUrlHeader(BASE_REQ_URL_HEADER, "/")(req);
  const baseNavURL = getUrlHeader(NAV_URL_HEADER, "/")(req);
  let reqURL = getUrlHeader(REQ_URL_HEADER)(req);
  let navURL = getUrlHeader(NAV_URL_HEADER)(req);

  if (!reqURL) {
    reqURL = new URL(
      `${augId}`,
      baseReqURL || new URL(`${new URL(req.url).origin}/${regId}/`),
    );
  }

  if (!navURL && baseNavURL) {
    navURL = new URL(`${augId}`, baseNavURL);
  }

  return {
    reqURL,
    navURL,
  };
}

function isNoContentStatus(
  status: number,
): status is typeof STATUS_CODE.NoContent | typeof STATUS_CODE.ResetContent {
  return status === STATUS_CODE.NoContent ||
    status === STATUS_CODE.ResetContent;
}
