# htmx extension

## [`observe`](../htmx/observe.js)

Many host apps will be using some kind of dynamic client-side scripting that
loads its own data and mutates the DOM. Our `css-rules` engine will need to know
when it should re-apply it's rules when this happens.

This extension can be used to observe part (or all) of the DOM for mutations
using a
[`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver).

The attribute `hx-observe="true"` should be placed on the element to be
observed, itself, and it's entire sub-tree will will be observed for mutations
caused outside of `htmx`. A `htmx:mutation` event will be dispatched when a
mutation is detected.

Parts of the tree can also be excluded from observation using
`hx-observe="false"` too if necessary.

### Events

#### [`htmx:afterProcessNode`](https://htmx.org/events/#htmx:afterProcessNode)

The extension listens for this event, which is dispatched by `htmx` when it adds
new elements into the DOM, or via a manual call to
[`htmx.process()`](https://htmx.org/api/#process) and then scans for the
`hx-observe` attribute on the target elements, and starts it's observations as
appropriate.

#### `htmx:beforeStartObserve`

Triggered before observations are started on a root element. This is
cancellable.

**Details**

- `detail.elt` - the root element for observations
- `detail.observeOptions` - the options to be passed to
  [MutationObserver.observe()](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe),
  these can be modified by the handler

#### `htmx:afterStartObserve`

Triggered after observations have started on a root element.

**Details** are the same as for `htmx:beforeStartObserve`.

#### `htmx:afterStopObserve`

Triggered on a root element once it is no longer being observed.

NOTE: There is no equivalent before event for this as it wouldn't be cancellable
or provide any configurable details anyway.

#### `htmx:mutation`

Triggered on a root element when itself or its sub-tree has been mutated outside
of `htmx` operations.

**Details**

- `detail.elt` - the root element for observations
- `detail.mutations` - an array of
  [MutationRecords](https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord)
  describing each change that occurred, but with any `htmx` related mutations
  filtered out
