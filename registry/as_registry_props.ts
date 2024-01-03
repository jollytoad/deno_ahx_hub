import { badRequest } from "$http_fns/response/bad_request.ts";
import { listAugmentations } from "./store.ts";
import { getRegistryPath } from "./registry_url.ts";
import { canEdit } from "./permission.ts";
import type { RegistryProps } from "./types.ts";

export async function asRegistryProps(
  req: Request,
  info: URLPatternResult,
): Promise<RegistryProps & { req: Request }> {
  const { regId } = info.pathname.groups;

  if (!regId) {
    throw badRequest();
  }

  const path = getRegistryPath(req, info);
  const augmentations = await listAugmentations(regId!);
  const editable = await canEdit(req, regId);

  return { req, regId, path, augmentations, editable };
}
