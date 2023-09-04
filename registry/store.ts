// deno-lint-ignore-file require-await

import { getItem, isWritable, listItems, removeItem, setItem } from "$store";
import type { Augmentation } from "./types.ts";

// const HOST_AUG_ID = "0";

const STORE = "augmentations";

export async function isReadonly(regId?: string): Promise<boolean> {
  return !await isWritable(regId ? [STORE, regId] : [STORE]);
}

export async function getAugmentation(
  regId: string,
  augId: string,
): Promise<Augmentation | undefined> {
  const aug = getItem<Augmentation>([STORE, regId, augId]);
  // if (!aug && augId === HOST_AUG_ID) {
  //   return hostAugmentationTemplate();
  // }
  return aug;
}

export async function setAugmentation(
  regId: string,
  augProps?: Partial<Augmentation>,
): Promise<Augmentation | undefined> {
  if (augProps) {
    const aug: Augmentation = await findAugmentation(regId, augProps) ?? {
      id: augProps.id || augProps.newid || String(await nextNumericId(regId)),
      url: augProps.url ?? "",
      enable: augProps.enable ?? true,
    };

    const newId = augProps.newid;
    const oldId = aug.id;

    if (newId && newId !== oldId) {
      aug.id = newId;
    }

    if (augProps.url !== aug.url && isValidURL(augProps.url)) {
      aug.url = augProps.url;
    }

    if (
      augProps.enable !== aug.enable && typeof augProps.enable === "boolean"
    ) {
      aug.enable = augProps.enable;
    }

    if (!isValidURL(aug.url)) {
      aug.enable = false;
    }

    await setItem([STORE, regId, aug.id], aug);

    if (aug.id !== oldId) {
      await deleteAugmentation(regId, oldId);
    }

    return aug;
  }
}

async function findAugmentation(
  regId: string,
  augProps?: Partial<Augmentation>,
): Promise<Augmentation | undefined> {
  if (augProps?.id) {
    return getAugmentation(regId, augProps.id);
  } else if (augProps?.url) {
    for await (const [, aug] of listItems<Augmentation>([STORE, regId])) {
      if (aug.url === augProps.url) {
        return aug;
      }
    }
  }
  return undefined;
}

export async function deleteAugmentation(
  regId: string,
  augId: string,
): Promise<void> {
  await removeItem([STORE, regId, augId]);
}

export async function listAugmentations(
  regId: string,
): Promise<Augmentation[]> {
  const augmentations: Augmentation[] = [];

  for await (const [, aug] of listItems<Augmentation>([STORE, regId])) {
    augmentations.push(aug);
  }

  // if (!augmentations.some((a) => a.id === HOST_AUG_ID)) {
  //   augmentations.unshift(hostAugmentationTemplate());
  // }
  return augmentations;
}

async function nextNumericId(regId: string): Promise<number> {
  let greatest = 0;
  for await (const [, aug] of listItems<Augmentation>([STORE, regId])) {
    const numericId = Math.ceil(Number.parseInt(aug.id)) || 0;
    greatest = Math.max(greatest, numericId);
  }
  return greatest + 1;
}

function isValidURL(url?: string): url is string {
  try {
    return !!url && !!new URL(url);
  } catch {
    return false;
  }
}

// function hostAugmentationTemplate(): Augmentation {
//   return {
//     id: HOST_AUG_ID,
//     url: "",
//     enable: false,
//   };
// }
