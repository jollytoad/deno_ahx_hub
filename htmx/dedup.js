htmx.defineExtension("dedup", {
  init(api) {
    document.addEventListener("htmx:oobBeforeSwap", (event) => {
      const { target, fragment } = event.detail || {};

      if (
        target &&
        fragment &&
        api.hasAttribute(fragment, "hx-dedup")
      ) {
        const swap = api.getAttributeValue(fragment, "hx-swap-oob");
        const isInsideTarget = swap?.startsWith("afterbegin") ||
          swap?.startsWith("beforeend");

        if (isInsideTarget) {
          const dupSelector = api.getAttributeValue(fragment, "hx-dedup") ||
            findSelector(fragment);

          if (dupSelector && target.querySelector(dupSelector)) {
            event.preventDefault();
          }
        }
      }
    });

    function findSelector(el) {
      // first look for an id in the children
      for (const child of el.children) {
        if (child.id) {
          return `#${child.id}`;
        }
      }
      // otherwise use the class names of the first child that has class names
      for (const child of el.children) {
        if (child.className) {
          return `.${[...child.classList].join(".")}`;
        }
      }
    }
  },
});
