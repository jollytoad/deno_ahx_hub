# Scripts and _htmx_ extensions for Augmented Hypermedia

This folder contains _htmx_, extensions and other scripts that form the
client-side JS provided by the registry to the host app.

## General stuff

- [htmx.js](./htmx.js) - copied directly from the latest release in
  [GitHub](https://github.com/bigskysoftware/htmx/blob/master/src/htmx.js)
  ([BSD 2-Clause License](https://github.com/bigskysoftware/htmx/blob/master/LICENSE))
- [config.js](./config.js) - provides some general setup and config for the host
  app, this should probably be host-specific eventually
- [index.js](./index.js) - entry point for the single JS bundle served up by the
  registry

## _htmx_ extensions

- [css-rules](../docs/css-rules.md)
- [observe](../docs/observe.md)

## Helpers

- [data-url](../docs/data-url.md)

## Other stuff

There are a bunch of other scripts/extension in this folder that are left over
from previous experiments, I'll clean them up eventually if they are definitely
no longer required.
