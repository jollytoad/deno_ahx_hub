import type { Augmentation } from "../types.ts";
import { Page } from "./Page.tsx";
import { RegistryList } from "./RegistryList.tsx";

interface Props {
  regId: string;
  path: string;
  augmentations: Augmentation[];
  readonly?: boolean;
}

export function RegistryPage(props: Props) {
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
          {props.readonly
            ? (
              <span>
                This is a read-only registry, it will need to be redeployed to
                update augmentations
              </span>
            )
            : <a href={`${props.path}/-/add`}>Register a new augmentation</a>}
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
