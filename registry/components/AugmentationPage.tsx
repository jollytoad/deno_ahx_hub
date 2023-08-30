import { Page } from "./Page.tsx";
import { AugmentationForm } from "./AugmentationForm.tsx";
import type { Augmentation } from "../types.ts";

interface Props {
  regId: string;
  path: string;
  augmentation?: Augmentation;
  readonly?: boolean;
}

export function AugmentationPage(
  { regId, path, augmentation, readonly }: Props,
) {
  return (
    <Page
      breadcrumbs={[
        [`Registry: ${regId}`, path],
        augmentation
          ? [
            `Augmentation: ${augmentation.id}`,
            `${path}/-/aug/${augmentation.id}`,
          ]
          : [`Augmentation`, `${path}/-/add`],
      ]}
    >
      <section class="box">
        <h3>{augmentation ? "Augmentation" : "Register Augmentation"}</h3>
        <AugmentationForm
          action={path}
          augmentation={augmentation}
          readonly={readonly}
        />
      </section>
    </Page>
  );
}
