import type { Augmentation } from "../types.ts";
import { RegistryItem } from "./RegistryItem.tsx";

interface Props {
  regId: string;
  path: string;
  augmentations: Augmentation[];
}

export function RegistryList(props: Props) {
  return (
    <ul id="registry" class="table rows">
      {props.augmentations.map((augmentation) => (
        <RegistryItem {...props} augmentation={augmentation} />
      ))}
    </ul>
  );
}
