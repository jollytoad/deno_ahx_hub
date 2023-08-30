// Host app specific configuration for htmx

htmx.logAll();

htmx.config.allowEval = false;

if (!htmx.config.allowOrigins) {
  htmx.config.allowOrigins = [];
}

if (!htmx.config.allowOrigins.includes(document.location.origin)) {
  htmx.config.allowOrigins.push(document.location.origin);
}

if (document.currentScript && document.currentScript.src) {
  const scriptOrigin = new URL(document.currentScript.src).origin;
  if (!htmx.config.allowOrigins.includes(scriptOrigin)) {
    htmx.config.allowOrigins.push(scriptOrigin);
  }
}

// Prevent any cross-origin htmx requests
addEventListener("htmx:beforeRequest", (event) => {
  const path = event.detail.requestConfig.path;

  // Allow an empty data url
  if (path === "data:,") {
    return;
  }

  const origin = new URL(path, document.baseURI).origin;

  if (!htmx.config.allowOrigins.includes(origin)) {
    console.error(
      "Attempt to perform cross-origin htmx request prevented:",
      path,
      event,
    );
    event.preventDefault();
  }
});

// Prevent any changes to htmx or it's config
Object.freeze(htmx.config);
Object.freeze(htmx.config.cssRules);
Object.freeze(htmx);
Object.defineProperty(window, "htmx", {
  configurable: false,
  enumerable: false,
  writable: false,
});
