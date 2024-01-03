import { renderHTML } from "$http_render_fns/render_html.tsx";
import { renderJSON } from "$http_render_fns/render_json.ts";
import { byPattern } from "$http_fns/by_pattern.ts";
import { byMethod } from "$http_fns/by_method.ts";
import { byMediaType } from "$http_fns/by_media_type.ts";
import { mapData } from "$http_fns/map_data.ts";
import { cascade } from "$http_fns/cascade.ts";
import { RegistryPage } from "./components/RegistryPage.tsx";
import { AugmentationPage } from "./components/AugmentationPage.tsx";
import { AugmentationCheck } from "./components/AugmentationCheck.tsx";
import { AugmentationEnabled } from "./components/AugmentationEnabled.tsx";
import { handleGetFile } from "./handle_get_file.ts";
import { handleSetAugmentation } from "./handle_set_augmentation.ts";
import { handleDeleteAugmentation } from "./handle_delete_augmentation.ts";
import { handleToggleAugmentation } from "./handle_toggle_augmentation.ts";
import { asAugmentationProps } from "./as_augmentation_props.ts";
import { asRegistryProps } from "./as_registry_props.ts";
import { renderCSS } from "./render_css.ts";

export default cascade(
  byPattern(
    "/:regId/-/:file(index.js|index.js.map)",
    byMethod({
      GET: handleGetFile,
    }),
  ),
  byPattern(
    "/:regId/-/index{.:ext}?",
    byMethod({
      GET: byMediaType({
        "text/html": mapData(asRegistryProps, renderHTML(RegistryPage)),
        "text/css": mapData(asRegistryProps, renderCSS),
        "application/json": mapData(asRegistryProps, renderJSON()),
      }),
    }),
  ),
  byPattern(
    "/:regId",
    byMethod({
      GET: byMediaType({
        "text/html": mapData(
          asRegistryProps,
          renderHTML(RegistryPage, undefined, { deferredTimeout: 10 }),
        ),
      }),
      POST: handleSetAugmentation,
    }),
  ),
  byPattern(
    "/:regId/-/add",
    byMethod({
      GET: byMediaType({
        "text/html": mapData(asAugmentationProps, renderHTML(AugmentationPage)),
      }),
    }),
  ),
  byPattern(
    "/:regId/-/aug/:augId{.:ext}?",
    byMethod({
      GET: byMediaType({
        "text/html": mapData(asAugmentationProps, renderHTML(AugmentationPage)),
        "application/json": mapData(asAugmentationProps, renderJSON()),
      }),
      DELETE: handleDeleteAugmentation,
    }),
  ),
  byPattern(
    "/:regId/-/aug/:augId/check",
    byMethod({
      GET: byMediaType({
        "text/html": mapData(
          asAugmentationProps,
          renderHTML(AugmentationCheck),
        ),
      }),
    }),
  ),
  byPattern(
    "/:regId/-/aug/:augId/:action(enable|disable)",
    byMethod({
      POST: byMediaType({
        "text/html": mapData(
          handleToggleAugmentation,
          renderHTML(AugmentationEnabled),
        ),
      }),
    }),
  ),
);
