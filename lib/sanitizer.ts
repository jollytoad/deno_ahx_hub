import type { Element } from "https://deno.land/x/lol_html@0.0.6/mod.ts";

const permittedTags = new Set([
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "bdi",
  "bdo",
  "blockquote",
  "body",
  "br",
  "button",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "main",
  "map",
  "mark",
  "menu",
  "meter",
  "nav",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "search",
  "section",
  "select",
  "slot",
  "small",
  "source",
  "span",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "template",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
]);

const permittedTagPrefixes = new Set([
  "ahx",
]);

const permittedGlobalAttrs = new Set([
  "accesskey",
  "autocapitalize",
  "class",
  "dir",
  "draggable",
  "enterkeyhint",
  "hidden",
  "id",
  "inert",
  "inputmode",
  "itemid",
  "itemprop",
  "itemref",
  "itemscope",
  "itemtype",
  "lang",
  "popover",
  "role",
  "style",
  "tabindex",
  "title",
  "translate",
]);

const permittedGlobalAttrPrefixes = new Set([
  "ahx",
  "aria",
  "data",
]);

const permittedTagAttrs: Record<string, Set<string>> = {
  "a": new Set(["href", "hreflang", "target"]),
  "audio": new Set(["controls", "loop", "muted", "src"]),
  "bdo": new Set(["dir"]),
  "blockquote": new Set(["cite"]),
  "button": new Set(["disabled", "name", "type", "value"]),
  "col": new Set(["align", "char", "charoff", "span"]),
  "colgroup": new Set(["align", "char", "charoff", "span"]),
  "del": new Set(["cite", "datetime"]),
  "dialog": new Set(["open"]),
  "fieldset": new Set(["disabled", "name"]),
  "form": new Set(["name", "action", "enctype", "method"]),
  "hr": new Set(["align", "size", "width"]),
  "img": new Set(["align", "alt", "height", "src", "width"]),
  "input": new Set([
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
  ]),
  "ins": new Set(["cite", "datetime"]),
  "meter": new Set(["value", "min", "max", "low", "high", "optimum"]),
  "ol": new Set(["start"]),
  "optgroup": new Set(["disabled", "label"]),
  "option": new Set(["disabled", "label", "selected", "value"]),
  "output": new Set(["name"]), // "for"?
  "progress": new Set(["max", "value"]),
  "q": new Set(["cite"]),
  "select": new Set(["disabled", "multiple", "name", "required", "size"]),
  "slot": new Set(["name"]),
  "source": new Set([
    "type",
    "src",
    "srcset",
    "sizes",
    "media",
    "height",
    "width",
  ]),
  "table": new Set(["align", "char", "charoff", "summary"]),
  "tbody": new Set(["align", "char", "charoff"]),
  "td": new Set(["align", "char", "charoff", "colspan", "headers", "rowspan"]),
  "textarea": new Set([
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
  ]),
  "tfoot": new Set(["align", "char", "charoff"]),
  "th": new Set([
    "align",
    "char",
    "charoff",
    "colspan",
    "headers",
    "rowspan",
    "scope",
  ]),
  "thead": new Set(["align", "char", "charoff"]),
  "tr": new Set(["align", "char", "charoff"]),
  "track": new Set(["default", "kind", "label", "src", "srclang"]),
  "video": new Set([
    "controls",
    "height",
    "loop",
    "muted",
    "poster",
    "src",
    "width",
  ]),
};

const permittedUrlSchemes = new Set([
  "http:",
  "https:",
]);

const urlAttributes = new Set([
  "action",
  "ahx-get",
  "ahx-post",
  "ahx-put",
  "ahx-patch",
  "ahx-delete",
  "cite",
  "data",
  "formaction",
  "href",
  "src",
]);

export function sanitizeElement(el: Element) {
  const tagName = el.tagName.toLowerCase();

  if (isPermittedElement(tagName)) {
    for (
      const { name, value } of el.attributes as {
        name: string;
        value: string;
      }[]
    ) {
      if (!isPermittedAttribute(tagName, name.toLowerCase(), value)) {
        el.removeAttribute(name);
      }
    }
  } else {
    el.remove();
  }
}

function isPermittedElement(tagName: string): boolean {
  if (permittedTags.has(tagName)) {
    return true;
  }

  const [prefix] = tagName.split("-", 1);

  if (permittedTagPrefixes.has(prefix)) {
    return true;
  }

  return false;
}

function isPermittedAttribute(
  tagName: string,
  attrName: string,
  value: string,
): boolean {
  if (attrName.startsWith("on")) {
    return false;
  }

  if (
    urlAttributes.has(attrName) && !isPermittedUrl(value.trim().toLowerCase())
  ) {
    return false;
  }

  if (permittedGlobalAttrs.has(attrName)) {
    return true;
  }

  const [prefix] = attrName.split("-", 1);

  if (permittedGlobalAttrPrefixes.has(prefix)) {
    return true;
  }

  if (permittedTagAttrs?.[tagName]?.has(attrName)) {
    return true;
  }

  return false;
}

function isPermittedUrl(value: string): boolean {
  try {
    const url = new URL(value, "http://example.com");
    return permittedUrlSchemes.has(url.protocol);
  } catch {
    return false;
  }
}
