import type { Augmentation } from "../types.ts";

interface Props {
  action?: string;
  augmentation?: Augmentation;
  editable?: boolean;
}

export function AugmentationForm(
  { action = "", augmentation, editable }: Props,
) {
  return (
    <form
      id="augmentation"
      class="table rows"
      action={action}
      method="post"
    >
      {augmentation?.id
        ? (
          <p>
            <label for="id">Id</label>
            <input
              id="id"
              name="newid"
              type="text"
              value={augmentation.id}
              readOnly={!editable}
            />
            <input
              name="id"
              type="hidden"
              value={augmentation.id}
            />
          </p>
        )
        : null}
      <p>
        <label for="url">URL</label>
        <input
          id="url"
          name="url"
          type="url"
          value={augmentation?.url}
          readOnly={!editable}
        />
      </p>
      <p>
        <label for="enable">Enabled</label>
        <input
          id="enable"
          name="enable"
          type="checkbox"
          value="true"
          checked={augmentation?.enable ?? true}
          disabled={!editable}
        />
      </p>
      <p>
        <div class="tool-bar">
          <button
            disabled={!editable}
            title={!editable ? "Sign in to edit" : undefined}
          >
            Save
          </button>
        </div>
      </p>
    </form>
  );
}
