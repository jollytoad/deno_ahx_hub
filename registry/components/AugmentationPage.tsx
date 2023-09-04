import { Page } from "./Page.tsx";
import { AugmentationForm } from "./AugmentationForm.tsx";
import type { AugmentationProps } from "../types.ts";

export function AugmentationPage(
  { regId, path, augmentation, editable }: AugmentationProps,
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
          editable={editable}
        />
      </section>
    </Page>
  );
}
