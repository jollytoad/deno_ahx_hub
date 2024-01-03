import { badRequest } from "$http_fns/response/bad_request.ts";
import { forbidden } from "$http_fns/response/forbidden.ts";
import { seeOther } from "$http_fns/response/see_other.ts";
import { deleteAugmentation } from "./store.ts";
import { getProxiedRegistryUrl } from "./registry_url.ts";
import { canEdit } from "./permission.ts";

export async function handleDeleteAugmentation(
  req: Request,
  info: URLPatternResult,
) {
  const { regId, augId } = info.pathname.groups;

  if (!regId || !augId) {
    return badRequest();
  }

  if (await canEdit(req, regId)) {
    await deleteAugmentation(regId, augId);

    const location = getProxiedRegistryUrl(req)?.href ??
      new URL(`/${regId}`, req.url).href;

    return seeOther(location);
  } else {
    return forbidden();
  }
}
