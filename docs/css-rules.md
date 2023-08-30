# htmx extension

## [`css-rules`](../htmx/css-rules.js)

Scans all enabled stylesheets for certain custom properties and copies those
properties over as attributes of the target elements of the CSS rule.

Only rules that match elements in scope of the extension will be processed, ie.
`hx-ext="css-rules"`.

Once attributes have been copied due to a rule match they remain in place even
if the rule no longer matches at a later time.

### Pseudo Elements

This also deals with `::before` and `::after` pseudo selectors by creating
_pseudo_ elements onto which the attributes are copied.

A _pseudo_ rule is also added, which targets the inserted element, this is what
actually causes the attributes to be copied.

### Custom properties

Currently supported custom properties are:

- `--hx-*`
- `--data-*`
- `--value`
- `--name`

these become equivalent attributes without the `--` prefix.

The set of supported props can be configured via
`htmx.config.cssRules.customProps`.

The values of these can be:

- plain strings (unquoted)
- single or double quoted strings
- [`url()`](https://developer.mozilla.org/en-US/docs/Web/CSS/url) function
- [`attr()`](https://developer.mozilla.org/en-US/docs/Web/CSS/attr) function
- `--prop()` custom function
- prefixed with `--append()` function

#### `url()`

The URL may be quoted or unquoted, and relative or absolute...

```css
url(/foo)
url("/foo")
url('foo.css')
url("http://example.com/foo")
```

Relative URLs are resolved against the URL of the Stylesheet.

#### `attr()`

The `attr` function takes an unquoted attribute name, and an optional type.

```css
attr(data-foo)
attr(href url)
```

At present, the only supported type is `url` which will result in the attribute
value being parsed as a URL and resolved against the document base URL.

#### `--prop()`

NOTE: This is not a standard CSS function.

This take the same arguments syntax as `attr()` but pulls the value directly
from a property of the DOM element as opposed to an attribute.

```css
--prop(innerText)
--prop(href url)
```

#### `--append()`

NOTE: This is not a standard CSS function.

Prefixing a custom property value with this will cause the value to be appended
to an existing value in the target attribute. It can accept a string that will
separate the new value.

```css
--append(',') attr(data-foo)
```

### Special Properties

There are a few special custom properties too that are handled in specific ways:

#### --css-rule-import

Imports the given CSS stylesheet if the rule matches once.

Example:

```css
[data-host-app="foo"] [data-page="projects"] {
  --css-rule-import: url("foo-projects.css");
}
```

The `url()` CSS function must be used.

This will actually insert a `<link>` element into the `document.head` when the
rule first matches at least one element. The property is removed from the
stylesheet once processed so that it doesn't get applied again.

As CSS only allows a single instance of a prop per rule, you can append an
arbitrary extension to the property name to allow importing of multiple sheets:

```css
.selector {
  --css-rule-import-common-styles: url("style.css");
  --css-rule-import-foo: url("foo.css");
}
```

NOTE: The stylesheet is not removed or disabled later should the rule no longer
match any element (this behaviour may get implemented in the future).

#### --css-rule-target

Override the target element(s) into which attributes are copied.

Similar to `--hx-target`, this may take the values:

- a CSS selector of the element(s) to target (scoped at the document level)
- `this` (default) target the target of rule
- `closest <CSS selector>` targets the closest ancestor matching the given
  selector
- `find <CSS selector>` target descendants of the rule target

#### --css-rule-source

Overrides the source element from which computed properties are obtained.

This takes the same values as `--css-rule-target`, and also:

- `rule` to use the properties directly from the CSS rule rather than computed
  properties of an element
- `target` to use the target as determined by `--css-rule-target` as the source
  of computed style properties

#### --css-rule-trigger

Triggers an event if the rule causes an attribute to be added/updated on a
target element. The value of this property is the event name.

### Events

#### `htmx:applyCssRules`

This can be dispatched by other scripts to force the CSS rules to be re-applied.
It's also triggered internally after pseudo elements or rules have been added.

#### `htmx:beforeApplyCssRules`

Triggered on `document` before the CSS rules are applied, this is cancellable.

**Details**

- `detail.cssRules` - the rules that have custom properties. This is a
  `Map<CSSStyleRule, Set<property-name-string>>`.

The `detail.cssRules` may be modified by the event handler.

#### `htmx:afterApplyCssRules`

Triggered on `document` after the CSS rules are applied, this is cancellable.
Has the same details as `htmx:beforeApplyCssRules`.

#### `htmx:beforePseudoElement`

Triggered before a _pseudo_ element is added to the document as a result of a
`::before` or `::after` rule declaring custom properties. This event is
cancellable.

**Details**

- `detail.elt` - the element into which the _pseudo_ element was inserted
- `detail.pseudoElt` - the _pseudo_ element
- `detail.pseudoId` - a unique identifier to link the element to the css rule
  (`rule.pseudoId`)
- `detail.place` - the literal `"before"` or `"after"`

The `detail.pseudoElt` and `detail.place` may be modified.

#### `htmx:afterPseudoElement`

Triggered after a _pseudo_ element has been added to the document, with the same
details as the `htmx:beforePseudoElement` event.

#### `htmx:beforePseudoRule`

When a _pseudo_ element is added, the original rule is duplicated to target the
inserted _pseudo_ element, it's this rule that actually causes the custom
properties to be copied to the _pseudo_ element. This event is triggered on the
document before the rule is added into the stylesheet, this is cancellable.

**Details**

- `detail.pseudoId` - a unique identifier to link the element to the css rule
  (`rule.pseudoId`)
- `detail.pseudoRule` - a representation of rule to be added
- `detail.rule` - the original
  [`CSSStyleRule`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleRule)
- `detail.place` - the literal `"before"` or `"after"`

The `detail.pseudoRule` may be modified.

#### `htmx:afterPseudoRule`

Triggered on the document after the _pseudo_ rule is added into the stylesheet.

**Details**

As for `htmx:beforePseudoRule`, except:

- `detail.pseudoRule` - the added
  [`CSSStyleRule`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleRule)

#### `htmx:beforeCssImport`

Triggered on the `document` before a CSS stylesheet is imported due to a
`--css-rule-import` property, this is cancellable.

**Details**

- `detail.url` - the URL of the stylesheet to be imported

#### `htmx:afterCssImport`

Triggered after a stylesheet imported via `--css-rule-import` has loaded.

**Details**

- `detail.elt` - the inserted `<link>` element for the stylesheet
- `detail.url` - the URL of the imported stylesheet

#### `htmx:beforeApplyCssRule`

Triggered on the original target elements of a CSS rule before it is applied,
this is cancellable.

**Details**

- `detail.elt` - the original target element matched by the CSS rule,
  irrespective of `--css-rule-target`
- `detail.rule` - the
  [`CSSStyleRule`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleRule)
- `detail.style` - the
  [`CSSStyleDeclaration`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration)
  derived from `--css-rule-source`
- `detail.props` - the custom props found on the source element, including
  `--css-rule-*` props
- `detail.attrs` - the set of attributes to be applied to the target element
- `detail.target` - the target element for the attributes, as derived from
  `--css-rule-target`
- `detail.source` - the source element of the custom properties, as derived from
  `--css-rule-source`

#### `htmx:afterApplyCssRule`

Triggered on the original target elements of a CSS rule after it has
successfully copied the custom properties to attributes, and applied
[`htmx.process`](https://htmx.org/api/#process) to the actual target.

**Details** are the same as `htmx:beforeApplyCssRule`.
