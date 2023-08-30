(function () {
  const EXT_NAME = "css-rules";

  htmx.config.cssRules = {
    defaultDelay: htmx.config.defaultSettleDelay,
    pseudoClass: "htmx-pseudo",
    customProps: [
      "--name",
      "--value",
      // "--ws-connect",
      // "--ws-send",
      // "--sse-connect",
      // "--sse-swap",
    ],
    maxLoopCount: 10,
  };

  let api;

  htmx.defineExtension(EXT_NAME, {
    init(api_) {
      api = api_;

      let handle = null;
      function debounced() {
        clearTimeout(handle);
        handle = setTimeout(
          applyRules,
          htmx.config.cssRules.defaultDelay,
        );
      }

      [
        "DOMContentLoaded",
        "load",
        "htmx:load",
        "htmx:afterSettle",
        "htmx:mutation",
        "htmx:afterCssImport",
        "htmx:applyCssRules",
      ]
        .forEach((event) => {
          addEventListener(event, debounced);
        });
    },
  });

  function isOurProp(prop) {
    return prop.startsWith("--hx-") || prop.startsWith("--data-") ||
      prop.startsWith("--css-rule-") ||
      htmx.config.cssRules.customProps.includes(prop);
  }

  function parseValue({ rule, style, prop, elt }) {
    let value = (style ?? rule.style).getPropertyValue(prop)?.trim();
    let delim = undefined;

    if (value) {
      // match: --append(<delim?>) *
      const isAppend = /^--append\(([^\)]*)\)\s+(.+)$/.exec(value);
      if (isAppend) {
        delim = isAppend[1] ? parseQuoted(isAppend[1]) : " ";
        value = isAppend[2];
      }

      // match: attr(<name> <type?>)
      const isAttr = /^attr\(([^\)\s,]+)(?:\s+([^\)\s,]+))?\)$/.exec(value);
      if (isAttr) {
        value = elt.getAttribute(isAttr[1]);
        if (isAttr[2] === "url") {
          value = new URL(value, elt.baseURI).href;
        }
        return [value, delim];
      } else {
        // match: --prop(<name> <type?>)
        const isProp = /^--prop\(([^\)\s,]+)(?:\s+([^\)\s,]+))?\)$/.exec(value);
        if (isProp) {
          value = elt[isProp[1]];
          if (isProp[2] === "url" && typeof value === "string") {
            value = new URL(value, elt.baseURI).href;
          } else if (
            !(typeof value === "string" || typeof value === "number" ||
              typeof value === "boolean")
          ) {
            value = undefined;
          }
          return [value, delim];
        }
      }

      // match: url(<url?>)
      const isURL = /^url\(([^\)]*)\)$/.exec(value);
      if (isURL) {
        value = isURL[1];
      }

      value = parseQuoted(value);

      if (isURL) {
        value = new URL(value, rule.parentStyleSheet.href).href;
      }
    }

    return [value, delim];
  }

  function parseQuoted(value) {
    // match: "<string?>" or '<string?>'
    const isQuoted = /^\"([^\"]*)\"$/.exec(value) ??
      /^\'([^\']*)\'$/.exec(value);
    if (isQuoted) {
      return isQuoted[1];
    }
    return value;
  }

  function findRules() {
    const cssRules = new Map(); // CSSStyleRule -> Set<props>

    function fromStylesheet(stylesheet) {
      if (!stylesheet.disabled) {
        try {
          fromRules(stylesheet.cssRules);
        } catch {
          // Skip SecurityError
        }
      }
    }

    function fromRules(rules) {
      for (const rule of rules) {
        if (rule instanceof CSSImportRule) {
          fromStylesheet(rule.styleSheet);
        } else if (rule instanceof CSSGroupingRule) {
          fromRules(rule.cssRules);
        } else if (rule instanceof CSSStyleRule) {
          fromStyleRule(rule);
        }
      }
    }

    function fromStyleRule(rule) {
      const props = new Set();
      for (const prop of rule.style) {
        if (isOurProp(prop)) {
          props.add(prop);
        }
      }
      if (props.size > 0) {
        cssRules.set(rule, props);
      }
    }

    for (const stylesheet of document.styleSheets) {
      fromStylesheet(stylesheet);
    }

    return cssRules;
  }

  let nextPseudoId = 1;

  function applyRules() {
    if (
      !document.querySelector(
        `[hx-ext*="${EXT_NAME}"], [data-hx-ext*="${EXT_NAME}]`,
      )
    ) {
      // Extension isn't referenced anywhere in the document
      return;
    }

    let hasPseudoElements = false;
    let hasAttributes = false;
    let hasToggledImports = false;
    let detail;
    let loop = 0;

    do {
      if (loop === 0 || hasPseudoElements) {
        detail = {
          cssRules: findRules(),
        };

        if (
          !htmx.trigger(document, "htmx:beforeApplyCssRules", detail)
        ) {
          return;
        }
      }

      const cssRules = detail.cssRules;

      console.debug("applyRules loop:", loop);

      let hasNewImports = false;

      for (const [rule, props] of cssRules) {
        switch (initCssImports(rule, props)) {
          case "created":
            hasNewImports = true;
            break;
          case "enabled":
          case "disabled":
            hasToggledImports = true;
            break;
        }
      }

      if (hasNewImports) {
        // Abort further processing, allowing new stylesheets to be loaded
        // Css rules will be re-applied once new stylesheets have loaded
        return;
      }

      hasPseudoElements = false;
      for (const [rule] of cssRules) {
        if (initPseudoElements(rule)) {
          hasPseudoElements = true;
        }
      }

      hasAttributes = false;
      for (const [rule, props] of cssRules) {
        if (applyAttributes(rule, props)) {
          hasAttributes = true;
        }
      }

      loop++;
    } while (
      loop < htmx.config.cssRules.maxLoopCount &&
      (hasAttributes || hasPseudoElements || hasToggledImports)
    );

    htmx.trigger(document, "htmx:afterApplyCssRules", detail);

    if (loop === htmx.config.cssRules.maxLoopCount) {
      console.error("htmx css-rules ext: exceeded maximum loop count", loop);
    }
  }

  function* find(selector) {
    for (const element of document.querySelectorAll(selector)) {
      if (isCssRulesEnabled(element)) {
        yield element;
      }
    }
  }

  function initPseudoElements(rule) {
    // TODO: better selectorText parsing
    const before = rule.selectorText.includes("::before");
    const after = before ? false : rule.selectorText.includes("::after");

    let modified = false;

    if (before || after) {
      const pseudoId = rule.htmxPseudoId || nextPseudoId++;
      const place = before ? "before" : "after";
      const parentSelector = rule.selectorText.replace(`::${place}`, "");

      for (const elt of find(parentSelector)) {
        // Insert a 'pseudo-element'
        if (createPseudoElement(elt, pseudoId, place)) {
          modified = true;
        }
      }

      if (createPseudoRule(rule, pseudoId, place)) {
        modified = true;
      }
    }

    return modified;
  }

  function createPseudoElement(elt, pseudoId, place) {
    const pseudoIdClass = `${htmx.config.cssRules.pseudoClass}-${pseudoId}`;

    if (!elt.querySelector(`:scope > .${pseudoIdClass}`)) {
      const parentTag = elt.localName;

      // TODO: Pick appropriate tag for other types of parent too
      const pseudoTag = ["ul", "ol", "menu"].includes(parentTag)
        ? "li"
        : "span";

      const placeClass = `${htmx.config.cssRules.pseudoClass}-${place}`;

      const pseudoElt = document.createElement(pseudoTag);
      pseudoElt.setAttribute(
        "class",
        `${htmx.config.cssRules.pseudoClass} ${placeClass} ${pseudoIdClass}`,
      );

      const detail = {
        pseudoElt,
        pseudoId,
        place,
      };

      if (htmx.trigger(elt, "htmx:beforePseudoElement", detail)) {
        const place = detail.place === "before" ? "afterBegin" : "beforeEnd";
        elt.insertAdjacentElement(place, detail.pseudoElt);
        htmx.trigger(elt, "htmx:afterPseudoElement", detail);
        return true;
      }
    }
    return false;
  }

  function createPseudoRule(rule, pseudoId, place) {
    if (!rule.htmxPseudoId) {
      // Create a 'pseudo-rule' to target the 'pseudo-element'
      rule.htmxPseudoId = pseudoId;

      const pseudoIdClass = `${htmx.config.cssRules.pseudoClass}-${pseudoId}`;

      const selectorText = rule.selectorText.replace(
        `::${place}`,
        ` > .${pseudoIdClass}`,
      );
      const cssText = rule.cssText.replace(rule.selectorText, selectorText);
      const pseudoRule = {
        selectorText,
        cssText,
        parentStyleSheet: rule.parentStyleSheet,
      };

      const detail = {
        pseudoId,
        pseudoRule,
        rule,
        place,
      };

      if (htmx.trigger(document, "htmx:beforePseudoRule", detail)) {
        const styleSheet = detail.pseudoRule.parentStyleSheet;
        const cssRules = styleSheet.cssRules;
        styleSheet.insertRule(detail.pseudoRule.cssText, cssRules.length);
        htmx.trigger(document, "htmx:afterPseudoRule", {
          ...detail,
          pseudoRule: cssRules[cssRules.length - 1],
        });
        return true;
      }
    }
    return false;
  }

  function initCssImports(rule, props) {
    let imported = false;
    for (const prop of props) {
      if (
        prop === "--css-rule-import" || prop.startsWith("--css-rule-import-")
      ) {
        if (!rule.hxCssRulesImportLinks) {
          rule.hxCssRulesImportLinks = {};
        }

        let link = rule.hxCssRulesImportLinks[prop];
        let ruleApplies = false;

        for (const elt of find(rule.selectorText)) {
          // TODO: consider getting computed style so that media queries are applied
          // and/or allow media-queries to be appended to the prop value, like `@import`

          const [url] = parseValue({ rule, prop, elt });

          if (url) {
            ruleApplies = true;
            if (link) {
              if (link.sheet && link.sheet.disabled) {
                link.sheet.disabled = false;
                imported = "enabled";
              }
              break;
            } else {
              link = createStyleSheetLink(
                url,
                rule.parentStyleSheet?.ownerNode?.crossOrigin,
              );

              if (link) {
                rule.hxCssRulesImportLinks[prop] = link;
                imported = "created";
                break;
              }
            }
          }
        }

        if (!ruleApplies && link && link.sheet && !link.sheet.disabled) {
          link.sheet.disabled = true;
          imported = "disabled";
        }
      }
    }
    return imported;
  }

  function createStyleSheetLink(url, crossOrigin) {
    const detail = { url, crossOrigin, disabled: false };

    if (htmx.trigger(document, "htmx:beforeCssImport", detail)) {
      if (
        !document.querySelector(`link[rel="stylesheet"][href="${detail.url}"]`)
      ) {
        const link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("href", detail.url);

        if (typeof detail.crossOrigin === "string") {
          link.setAttribute("crossorigin", detail.crossOrigin);
        }

        link.addEventListener("load", (event) => {
          htmx.trigger(event.target, "htmx:afterCssImport", detail);
        }, { once: true, passive: true });

        document.head.appendChild(link);
        return link;
      }
    }
  }

  function applyAttributes(rule, props) {
    const detailsQueue = [];

    for (const elt of find(rule.selectorText)) {
      if (elt.matches(rule.selectorText)) {
        const targets = findElements(elt, rule, "--css-rule-target");

        if (targets.length) {
          const sources = findElements(elt, rule, "--css-rule-source");
          // console.groupCollapsed("CSSRULE", rule.selectorText);
          // console.log("CSSRULE TARGETS", ...targets);
          // console.log("CSSRULE SOURCES", ...sources);

          for (const source of sources) {
            let style = source instanceof Element
              ? getComputedStyle(source)
              : source === "rule"
              ? rule.style
              : undefined;

            if (style || source === "target") {
              for (const target of targets) {
                if (source === "target") {
                  style = getComputedStyle(target);
                }

                const attrs = new Map();

                for (const prop of props) {
                  if (!prop.startsWith("--css-rule-")) {
                    let [value, delim] = parseValue({
                      rule,
                      style,
                      prop,
                      elt: source === "target" ? target : source,
                    });

                    if (value) {
                      const isImportant =
                        style.getPropertyPriority(prop) === "important";
                      const attr = prop.replace(/^--/, "");

                      if (typeof delim === "string") {
                        const existingValue = target.getAttribute(attr);
                        if (existingValue?.length) {
                          if (existingValue.split(delim).includes(value)) {
                            value = existingValue;
                          } else {
                            value = existingValue + delim + value;
                          }
                        }
                      }

                      if (
                        (isImportant || typeof delim === "string" ||
                          !target.hasAttribute(attr)) &&
                        target.getAttribute(attr) !== value
                      ) {
                        attrs.set(attr, value);
                      }
                    }
                  }
                }

                if (attrs.size) {
                  const detail = {
                    elt,
                    rule,
                    style,
                    props,
                    attrs,
                    target,
                    source,
                  };

                  if (
                    htmx.trigger(elt, "htmx:beforeApplyCssRule", detail)
                  ) {
                    for (const [attr, value] of detail.attrs) {
                      detail.target.setAttribute(attr, value);
                    }

                    detailsQueue.push(detail);
                  }
                }
              }
            }
          }

          // console.groupEnd();
        }
      }
    }

    const trigger = rule.style.getPropertyValue("--css-rule-trigger")?.trim();
    const triggerQueue = new Set();

    for (const detail of detailsQueue) {
      htmx.process(detail.target);
      htmx.trigger(detail.elt, "htmx:afterApplyCssRule", detail);

      if (trigger) {
        triggerQueue.add(detail.target);
      }
    }

    if (triggerQueue.size) {
      setTimeout(() => {
        for (const triggerTarget of triggerQueue) {
          htmx.trigger(triggerTarget, trigger);
        }
      }, 0);
    }

    return detailsQueue.length > 0;
  }

  function findElements(elt, rule, prop) {
    const [selector] = parseValue({ rule, prop, elt });
    if (!selector || selector === "this") {
      return [elt];
    } else if (
      prop === "--css-rule-source" &&
      (selector === "rule" || selector === "target")
    ) {
      return [selector];
    } else if (selector.startsWith("closest ")) {
      return [htmx.closest(elt, selector.substr(8))];
    } else if (selector.startsWith("find ")) {
      return elt.querySelectorAll(selector.substr(5));
    } else {
      return document.querySelectorAll(selector);
    }
  }

  function isCssRulesEnabled(elt) {
    const exts = api.getAttributeValue(elt, "hx-ext")?.split(",");
    if (exts?.includes(`ignore:${EXT_NAME}`)) {
      return false;
    } else if (exts?.includes(EXT_NAME)) {
      return true;
    }
    return isCssRulesEnabled(elt.parentElement);
  }

  htmx.createStyleSheetLink = createStyleSheetLink;
})();
