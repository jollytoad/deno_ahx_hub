export interface Augmentation {
  id: string;
  newid?: string;
  url: string;
  enable: boolean;
}

export interface AugmentationProps {
  regId: string;
  path: string;
  augmentation?: Augmentation;
  editable?: boolean;
}

export interface RegistryProps {
  regId: string;
  path: string;
  augmentations: Augmentation[];
  editable?: boolean;
}
