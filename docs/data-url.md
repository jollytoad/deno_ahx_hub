# script

## [`data-url`](../htmx/data-url.js)

This isn't really a htmx extension but a script to add `data-url-*` attributes
to the root `html` element, these derive from the `window.location`...

- `data-url-href` from `location.href`
- `data-url-host` from `location.host`
- `data-url-path` from `location.pathname`
- `data-url-hash` from `location.hash`

This is mainly of use in combination with the `css-rules` extension, allowing
rules to match based on the location.
