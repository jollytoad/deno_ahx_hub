import type { AugmentationProps } from "../types.ts";
import { proxiedUrl } from "../proxied_url.ts";
import { AugmentationCheck } from "./AugmentationCheck.tsx";

export function RegistryItem(props: AugmentationProps) {
  const { path, editable, augmentation } = props;
  if (!augmentation) {
    return null;
  }
  const { id, url, enable } = augmentation;
  const mode = editable ? "Edit" : "View";
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
            disabled={!editable}
          >
            Delete
          </button>
        </span>
      </span>
      <AugmentationCheck {...props} placeholder />
    </li>
  );
}
