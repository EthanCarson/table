// EditGameForm.jsx
// Creator-only screen for renaming a game, changing its roster, or
// deleting it. The delete confirmation is local state here, so Game
// doesn't need an isDeleting flag of its own.
//
// gamePlayers (current roster) and allPlayers (every profile, for the
// checkbox list) both come in as props from Game.jsx.

import { useState } from "react";

function EditGameForm({
  game,
  onSave,
  onDelete,
  onCancel,
  gamePlayers,
  allPlayers,
  currentPlayer,
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const currentIDs = gamePlayers.map((p) => p.id);

  function handleSubmit(e) {
    e.preventDefault();
    // Read through .elements: form.name is the form's own name attribute,
    // so e.target.name.value would be undefined here.
    const { name, description } = e.target.elements;

    const selectedPlayerIDs = Array.from(
      e.target.querySelectorAll('input[name="players"]:checked'),
    ).map((el) => el.value);

    // Two separate arguments on purpose: games and game_players are
    // different tables, so the game edit and the roster edit are two
    // different writes even though they're saved from one form.
    onSave(
      { name: name.value, description: description.value },
      selectedPlayerIDs,
    );
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

        <p>Players</p>
        {allPlayers
          .filter((player) => player.id !== currentPlayer)
          .map((player) => (
            <label key={player.id}>
              <input
                type="checkbox"
                name="players"
                value={player.id}
                defaultChecked={currentIDs.includes(player.id)}
              />
              {player.name}
            </label>
          ))}

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
