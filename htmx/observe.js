htmx.defineExtension("observe", {
  init(api) {
    const ROOT_SELECTOR = "[hx-observe], [data-hx-observe]";

    const observeRoots = new Set();
    const blockedRoots = new Set();
    let observer = null;

    let htmxClasses = [];

    function applyObservations() {
      // Find the root element where this ext has been added
      const newRoots = document.querySelectorAll(ROOT_SELECTOR);

      const removeRoots = new Set(observeRoots);
      const addRoots = new Map();
      blockedRoots.clear();

      for (const newRoot of newRoots) {
        const observeAttr = api.getAttributeValue(newRoot, "hx-observe");
        if (observeAttr === "true") {
          removeRoots.delete(newRoot);
          addRoots.set(newRoot, observeAttr);
        } else if (observeAttr === "false") {
          blockedRoots.add(newRoot);
        }
      }

      if (observer && removeRoots.size > 0) {
        // Disconnect the old observer
        observer.disconnect();
        observeRoots.clear();
        for (const root of removeRoots) {
          api.triggerEvent(root, "htmx:afterStopObserve");
        }
        removeRoots.clear();
      }

      if (addRoots.size > 0) {
        // Start observing the new root elements

        if (!observer) {
          htmxClasses = [
            htmx.config.indicatorClass,
            htmx.config.requestClass,
            htmx.config.addedClass,
            htmx.config.settlingClass,
            htmx.config.swappingClass,
          ];

          observer = new MutationObserver((mutations) => {
            // Group mutations by closest root hx-observe
            const groups = new Map();

            for (const mutation of mutations) {
              if (isFromHtmx(mutation)) continue;

              const root = htmx.closest(mutation.target, ROOT_SELECTOR);
              if (root && !blockedRoots.has(root)) {
                let group = groups.get(root);
                if (!group) {
                  group = [];
                  groups.set(root, group);
                }
                group.push(mutation);
              }
            }

            // Emit a htmx:mutation event when mutations occur
            for (const [root, mutations] of groups.entries()) {
              api.triggerEvent(root, "htmx:mutation", { mutations });
            }
          });
        }

        for (const [root, _observeAttr] of addRoots.entries()) {
          if (!observeRoots.has(root)) {
            const detail = {
              observeOptions: {
                subtree: true,
                childList: true,
                attributes: true,
                attributeOldValue: true,
              },
            };
            if (api.triggerEvent(root, "htmx:beforeStartObserve", detail)) {
              observer.observe(root, detail.observeOptions);
              observeRoots.add(root);
              api.triggerEvent(root, "htmx:afterStartObserve", detail);
            }
          }
        }
      }
    }

    function isFromHtmx(mutation) {
      const a = mutation.attributeName;

      if (a && (a.startsWith("hx-") || a.startsWith("data-hx-"))) return true;

      if (a === "class") {
        // Check whether class changes are just htmx classes
        const o = mutation.oldValue?.split(/\s+/) ?? [];
        const n = [...mutation.target.classList];
        const d = [
          ...o.filter((c) => !n.includes(c)),
          ...n.filter((c) => !o.includes(c)),
        ].filter((c) => !htmxClasses.includes(c));
        return d.length === 0;
      }

      if (!a && mutation.addedNodes.length) {
        let count = mutation.addedNodes.length;
        for (const node of mutation.addedNodes) {
          // Ignore non-elements and nodes being added by htmx
          if (
            node.nodeType !== 1 ||
            htmx.closest(node, `.${htmx.config.addedClass}`)
          ) {
            count--;
          }
        }
        return count === 0;
      }

      return false;
    }

    document.addEventListener("htmx:afterProcessNode", applyObservations);
  },
});
