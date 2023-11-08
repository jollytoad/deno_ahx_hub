import type { AugmentationProps } from "../types.ts";

export function AugmentationEnabled(
  { path, augmentation, editable }: AugmentationProps,
) {
  return augmentation
    ? (
      <input
        type="checkbox"
        checked={augmentation.enable}
        hx-post={`${path}/-/aug/${augmentation.id}/${
          augmentation.enable ? "disable" : "enable"
        }`}
        hx-target="this"
        hx-swap="outerHTML"
        disabled={!editable}
      />
    )
    : null;
}
