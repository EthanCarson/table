// EditGameForm.jsx
// Creator-only screen for renaming a game or deleting it. The delete
// confirmation is local state here, so Game doesn't need an isDeleting
// flag of its own.

import { useState } from "react";

function EditGameForm({ game, onSave, onDelete, onCancel }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // Read through .elements: form.name is the form's own name attribute,
    // so e.target.name.value would be undefined here.
    const { name, description } = e.target.elements;
    onSave(name.value, description.value);
  }

  if (confirmingDelete) {
    return (
      <>
        <p>Delete "{game.name}"? This can't be undone.</p>
        <button type="button" onClick={() => setConfirmingDelete(false)}>
          Keep game
        </button>
        <button type="button" onClick={onDelete}>
          Delete game
        </button>
      </>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Game name:</label>
        <input type="text" id="name" name="name" defaultValue={game.name} />

        <label htmlFor="description">Game description:</label>
        <input
          type="text"
          id="description"
          name="description"
          defaultValue={game.description}
        />

        <button type="submit">Save changes</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </form>

      <button type="button" onClick={() => setConfirmingDelete(true)}>
        Delete game
      </button>
    </>
  );
}

export default EditGameForm;