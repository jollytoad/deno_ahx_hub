import { Ammonia, AmmoniaBuilder, init } from "$ammonia/mod.ts";
import { replaceBody } from "$http_fns/response/replace_body.ts";

let ammonia: Ammonia | undefined;

export default () =>
async (
  res: Response,
  prefix: string,
): Promise<Response> => {
  const rawContent = await res.text();
  const cleanContent = await clean(rawContent, prefix);

  // if (cleanContent !== rawContent) {
  //   console.debug(
  //     "---- CLEANED: ----\n",
  //     rawContent,
  //     "\n---- TO: ----\n",
  //     cleanContent,
  //     "\n----",
  //   );
  // }

  return replaceBody(res, cleanContent);
};

const DEPRECATED_TAGS = ["acronym", "center", "rtc"];
const MISSING_TAGS = {
  "address": [],
  "menu": [],
  "section": [],
  "tfoot": [],
};
const MEDIA_TAGS = {
  "audio": ["controls", "loop", "muted", "src"],
  "picture": [],
  "source": ["type", "src", "srcset", "sizes", "media", "height", "width"],
  "track": ["default", "kind", "label", "src", "srclang"],
  "video": ["controls", "height", "loop", "muted", "poster", "src", "width"],
};
const FORM_TAGS = {
  "button": ["disabled", "name", "type", "value"],
  "datalist": [],
  "dialog": ["open"],
  "fieldset": ["disabled", "name"],
  "form": ["name", "action", "enctype", "method"],
  "input": [
    "type",
    "accept",
    "checked",
    "disabled",
    "max",
    "maxlength",
    "min",
    "minlength",
    "multiple",
    "name",
    "pattern",
    "placeholder",
    "readonly",
    "required",
    "size",
    "step",
    "value",
  ],
  "label": [], // "for"?
  "legend": [],
  "meter": ["value", "min", "max", "low", "high", "optimum"],
  "optgroup": ["disabled", "label"],
  "option": ["disabled", "label", "selected", "value"],
  "output": ["name"], // "for"?
  "progress": ["max", "value"],
  "select": ["disabled", "multiple", "name", "required", "size"],
  "textarea": [
    "cols",
    "disabled",
    "maxlength",
    "minlength",
    "name",
    "placeholder",
    "readonly",
    "required",
    "rows",
    "spellcheck",
    "wrap",
  ],
};

const GLOBAL_ATTRS = [
  "class",
  "draggable",
  "hidden",
  "id",
  "itemid",
  "itemprop",
  "itemref",
  "itemscope",
  "itemtype",
  "role",
  "tabindex",
];

async function clean(raw: string, prefix: string): Promise<string> {
  if (!ammonia) {
    await init();

    const builder = new AmmoniaBuilder();

    // TODO: Allow the host app to supply configuration for this
    // TODO: Allow augmentations to declare opt-in tags (so long as allowed by host)

    DEPRECATED_TAGS.forEach(builder.tags.delete, builder.tags);

    [MISSING_TAGS, MEDIA_TAGS, FORM_TAGS].forEach((tags) => {
      Object.entries(tags).forEach(([tag, attrs]) => {
        builder.tags.add(tag);
        if (attrs && attrs.length > 0) {
          if (builder.tagAttributes.has(tag)) {
            const attrSet = builder.tagAttributes.get(tag)!;
            attrs.forEach(attrSet.add, attrSet);
          } else {
            builder.tagAttributes.set(tag, new Set(attrs));
          }
        }
      });
    });

    // TODO: Restrict input type attribute values

    GLOBAL_ATTRS.forEach((attr) => builder.genericAttributes.add(attr));

    builder.genericAttributePrefixes = new Set([
      "hx-",
      "data-",
      "aria-",
      "sse-",
      "ws-",
    ]);

    builder.urlSchemes = new Set(["http", "https"]);

    builder.linkRel = null;
    builder.idPrefix = prefix;

    ammonia = builder.build();
  }
  return ammonia.clean(raw);
}
