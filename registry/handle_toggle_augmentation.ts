import { badRequest } from "$http_fns/response/bad_request.ts";
import { forbidden } from "$http_fns/response/forbidden.ts";
import type { AugmentationProps } from "./types.ts";
import { setAugmentation } from "./store.ts";
import { canEdit } from "./permission.ts";
import { asAugmentationProps } from "./as_augmentation_props.ts";

export async function handleToggleAugmentation(
  req: Request,
  info: URLPatternResult,
): Promise<AugmentationProps> {
  const { regId, augId, action } = info.pathname.groups;

  if (
    !regId || !augId || !action ||
    !(action === "enable" || action === "disable")
  ) {
    throw badRequest();
  }

  if (await canEdit(req, regId)) {
    await setAugmentation(regId, {
      id: augId,
      enable: action === "enable",
    });

    return asAugmentationProps(req, info);
  } else {
    throw forbidden();
  }
}
