import type { RegistryProps } from "../types.ts";
import { Page } from "./Page.tsx";
import { RegistryList } from "./RegistryList.tsx";

export function RegistryPage(props: RegistryProps) {
  return (
    <Page
      breadcrumbs={[
        [`Registry: ${props.regId}`, props.path],
      ]}
    >
      <section class="box">
        <h3>Augmentations</h3>

        <RegistryList {...props} />

        <p>
          {props.editable
            ? <a href={`${props.path}/-/add`}>Register a new augmentation</a>
            : null}
        </p>
      </section>

      <p>
        <a href={`${props.path}/-/index.css`} target="_blank">
          View combined stylesheet of all enabled augmentations
        </a>
      </p>
    </Page>
  );
}
