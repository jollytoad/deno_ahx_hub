import { getBodyAsObject } from "$http_fns/request/body_as_object.ts";
import { badRequest } from "$http_fns/response/bad_request.ts";
import { forbidden } from "$http_fns/response/forbidden.ts";
import { seeOther } from "$http_fns/response/see_other.ts";
import type { Augmentation } from "./types.ts";
import { setAugmentation } from "./store.ts";
import { getProxiedRegistryUrl } from "./registry_url.ts";
import { canEdit } from "./permission.ts";

export async function handleSetAugmentation(
  req: Request,
  info: URLPatternResult,
) {
  const { regId } = info.pathname.groups;

  if (!regId) {
    return badRequest();
  }

  if (await canEdit(req, regId)) {
    const data = await getBodyAsObject<Partial<Augmentation>>(
      req,
      processForm,
    );

    await setAugmentation(regId, data);

    const location = getProxiedRegistryUrl(req)?.href ?? req.url;

    return seeOther(location);
  } else {
    return forbidden();
  }
}

function processForm(data: Record<string, unknown>): Partial<Augmentation> {
  return {
    ...data,
    enable: data.enable === "true",
  };
}
