import { badRequest } from "$http_fns/response/bad_request.ts";
import { notFound } from "$http_fns/response/not_found.ts";
import type { AugmentationProps } from "./types.ts";
import { getAugmentation } from "./store.ts";
import { getRegistryPath } from "./registry_url.ts";
import { canEdit } from "./permission.ts";

export async function asAugmentationProps(
  req: Request,
  info: URLPatternResult,
): Promise<AugmentationProps & { req: Request }> {
  const { regId, augId } = info.pathname.groups;

  if (!regId) {
    throw badRequest();
  }

  const path = getRegistryPath(req, info);
  const editable = await canEdit(req, regId);

  if (augId) {
    const augmentation = await getAugmentation(regId, augId);

    if (!augmentation) {
      throw notFound();
    }

    return { req, regId, path, augmentation, editable };
  } else {
    return { req, regId, path, editable };
  }
}
