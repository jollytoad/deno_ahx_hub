import type { Augmentation } from "../types.ts";
import { proxiedUrl } from "../proxied_url.ts";

interface Props extends Augmentation {
  regId: string;
  path: string;
  readonly?: boolean;
}

export function RegistryItem({ path, id, url, enable, readonly }: Props) {
  const mode = readonly ? "View" : "Edit";
  return (
    <li data-aug-id={id} class="item">
      <span class="enable" title={enable ? "Enabled" : "Disabled"}>
        {enable ? "☑︎" : "☐"}
      </span>
      <span class="id" title="Id">{id}</span>
      <span class="url">
        {url
          ? <a href={url} target="_blank">{url}</a>
          : id === "0"
          ? <i>(host augmentation)</i>
          : null}
      </span>
      <span class="actions">
        <span class="tool-bar">
          <a href={`${path}/-/aug/${id}`} class="edit">{mode}</a>
          <a href={`${path}/-/aug/${id}.json`} class="data" target="_blank">
            Data
          </a>
          {url
            ? (
              <a
                href={proxiedUrl(path, id, url)}
                class="proxied"
                target="_blank"
              >
                Proxied
              </a>
            )
            : null}
          <button
            class="delete"
            hx-delete={`${path}/-/aug/${id}`}
            hx-confirm="Are you sure?"
            hx-target="closest .item"
            hx-swap="delete"
            disabled={readonly}
          >
            Delete
          </button>
        </span>
      </span>
    </li>
  );
}
