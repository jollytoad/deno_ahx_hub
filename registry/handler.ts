import { renderHTML } from "$http_render_fns/render_html.tsx";
import { renderJSON } from "$http_render_fns/render_json.ts";
import { getBodyAsObject } from "$http_fns/request/body_as_object.ts";
import { byPattern } from "$http_fns/pattern.ts";
import { byMethod } from "$http_fns/method.ts";
import { byMediaType } from "$http_fns/media_type.ts";
import { serveDir } from "$std/http/file_server.ts";
import { fromFileUrl } from "$std/path/mod.ts";
import { mapData } from "$http_fns/map.ts";
import { cascade } from "$http_fns/cascade.ts";
import { badRequest } from "$http_fns/response/bad_request.ts";
import { forbidden } from "$http_fns/response/forbidden.ts";
import { seeOther } from "$http_fns/response/see_other.ts";
import { notFound } from "$http_fns/response/not_found.ts";
import { ok } from "$http_fns/response/ok.ts";
import type { Augmentation, AugmentationProps } from "./types.ts";
import {
  deleteAugmentation,
  getAugmentation,
  isReadonly,
  listAugmentations,
  setAugmentation,
} from "./store.ts";
import { RegistryPage } from "./components/RegistryPage.tsx";
import { AugmentationPage } from "./components/AugmentationPage.tsx";
import { getProxiedRegistryUrl, getRegistryPath } from "./registry_url.ts";
import { asCssImport } from "./css_import.ts";
import { canEdit } from "./permission.ts";
import { AugmentationCheck } from "./components/AugmentationCheck.tsx";

type RegistryProps = Parameters<typeof RegistryPage>[0];

const fsRoot = fromFileUrl(import.meta.resolve("./static"));

export default cascade(
  byPattern(
    "/:regId/-/index.js{.map}?",
    byMethod({
      GET: handleGetScript,
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
);

function handleGetScript(req: Request, info: URLPatternResult) {
  return serveDir(req, {
    fsRoot,
    urlRoot: `${info.pathname.groups.regId}/-`,
  });
}

async function handleSetAugmentation(req: Request, info: URLPatternResult) {
  const { regId } = info.pathname.groups;

  if (!regId) {
    return badRequest();
  }

  const readonly = await isReadonly(regId);

  if (readonly) {
    return forbidden();
  } else {
    const data = await getBodyAsObject<Partial<Augmentation>>(
      req,
      processForm,
    );

    await setAugmentation(regId, data);

    const location = getProxiedRegistryUrl(req)?.href ?? req.url;

    return seeOther(location);
  }
}

async function handleDeleteAugmentation(req: Request, info: URLPatternResult) {
  const { regId, augId } = info.pathname.groups;

  if (!regId || !augId) {
    return badRequest();
  }

  const readonly = await isReadonly(regId);

  if (readonly) {
    return forbidden();
  } else {
    await deleteAugmentation(regId, augId);

    const location = getProxiedRegistryUrl(req)?.href ??
      new URL(`/${regId}`, req.url).href;

    return seeOther(location);
  }
}

async function asRegistryProps(
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

async function asAugmentationProps(
  req: Request,
  info: URLPatternResult,
): Promise<AugmentationProps & { req: Request }> {
  const { regId, augId } = info.pathname.groups;

  if (!regId) {
    throw badRequest();
  }

  const path = getRegistryPath(req, info);
  const editable = await canEdit(req, regId, augId);

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

function renderCSS(
  req: Request,
  { path, augmentations }: RegistryProps,
): Response {
  // If the request has an Origin headers we assume the browser is accessing the
  // registry cross-origin, and so we'll response using `--css-rule-import`s
  // instead of standard CSS `@import` rules, as they would prevent us from
  // analysing the stylesheet in the browser. `@import` lacks the ability to
  // declare `crossorigin`.
  const crossOrigin = req.headers.has("Origin");

  const head = crossOrigin ? ":root {\n" : "";
  const tail = crossOrigin ? "}\n" : "";

  const body = new Blob([
    head,
    ...augmentations.map(asCssImport(path, crossOrigin)),
    tail,
  ]);

  return ok(body, {
    "Content-Type": "text/css; charset=utf-8",
    "Vary": "Origin",
  });
}

function processForm(data: Record<string, unknown>): Partial<Augmentation> {
  return {
    ...data,
    enable: data.enable === "true",
  };
}
