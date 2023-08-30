(function () {
  function applyDataUrl() {
    const loc = window.location;
    const root = document.documentElement;
    if (root && root.getAttribute("data-url-href") !== loc.href) {
      root.setAttribute("data-url-href", loc.href);
      root.setAttribute("data-url-host", loc.host);
      root.setAttribute("data-url-path", loc.pathname);
      root.setAttribute("data-url-hash", loc.hash);
      // TODO: Expand search params to attributes
    }
  }

  [
    "DOMContentLoaded",
    "load",
    "hashchange",
    "popstate",
    "htmx:load",
    "htmx:beforeApplyCssRules",
  ]
    .forEach((event) => {
      addEventListener(event, applyDataUrl);
    });

  applyDataUrl();
})();
