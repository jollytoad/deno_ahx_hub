# Augmented Hypermedia Hub

This is a reference implementation of an _Augmented Hypermedia Hub_.

It's an http web app that provides a UI, API and proxy for any number of
_Augmented Hypermedia Registries_.

See the [Architecture](./docs/architecture.md) docs for more details.

## Pre-requisites

Deno is required to run the server, using [Homebrew](https://brew.sh) on a
Mac...

```sh
brew install deno
```

or see the
[installation guide](https://deno.land/manual/getting_started/installation) for
alternatives.

## Usage

Start the server:

```sh
PORT=8888 deno task start
```

(That's really all there is to it, no need to install any npm packages!)

The service has no homepage as such, but instead provides a UI for a named
registry, given in the path of the URL.

For example, to open the 'ref' registry in your browser:
http://localhost:8888/ref

## How do augmentations work?

_(WIP: This info is to be gradually moved into [docs](./docs))_

Our augmentations are built on top of [_htmx_](https://htmx.org/), which is a
Javascript library that extends the hypermedia controls of HTML via custom
attributes. It's worth familiarising yourself with _htmx_ to understand what we
are doing below.

Augmentations are applied via CSS rules in a regular CSS stylesheet, and this
what you registered above.

The example stylesheet above contains the following:

```css
#x-footer-below::after {
  --hx-get: url("footer-blurb.html");
  --hx-trigger: load once;
}
```

This project provides a _htmx_ extension called
[`css-rules`](./service/host/static/hx/css-rules.js).

Which searches for
[custom CSS properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
that begin `--hx-` and copies those properties to the attributes of any element
that matches the selector.

It also supports insertion of _pseudo_ elements if you use the `::before` or
`::after` CSS pseudo-element selector.

So in this case:

```html
<div id="x-footer-below">
```

becomes...

```html
<div id="x-footer-below">
  <span class="htmx-pseudo" hx-get="http://localhost:8000/registry/1/footer-blurb.html" hx-trigger="load once">
```

(the relative URL is resolved against the URL of the stylesheet to create the
absolute URL above)

and we then tell _htmx_ to process this element to wire up it's hypermedia
controls.

In our example, those `hx-*` attributes will trigger a `GET` request to the
given URL immediately but only once, and inject the returned HTML content into
the `<div>` element.

See [`hx-get`](https://htmx.org/attributes/hx-get) and
[`hx-trigger`](https://htmx.org/attributes/hx-trigger) for more information
about these attributes.

Also, take a look at the [addons](./service/addons/static/) service for more
`.css` augmentations that can be registered.

For example: `http://localhost:8100/message/clear.css`, and take a look at the
[DOM Mutations Example](http://localhost:8000/mutations).

## Security

The default behaviour is prevent augmentations from executing any script, but
allowing them access to the full range of hypermedia controls provided by
_htmx_. We have a few security measures in place to ensure this:

- All _htmx_ initiated requests are restricted to the same origin as the host
  app, using a `htmx:beforeRequest` event listener. See
  [hx/config.js](./service/host/static/hx/config.js)
- So all augmentation content is fetched via the host app proxy, and in turn the
  registry proxy.
- The registry proxy restricts the type of content that can be fetched, and
  performs sanitation on the content. For HTML content we use
  [Ammonia](https://github.com/lucacasonato/ammonia-wasm). See
  [lib/cleanser](./service/registry/lib/cleanser/mod.ts)

NOTE: this is **work in progress**, it needs a much more thorough test/audit
before being production ready.
