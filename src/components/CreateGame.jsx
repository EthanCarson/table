// CreateGame.jsx
// Form for creating a game: name, description, and which profiles to
// invite. Creates the game, adds the players, then hands the new game's
// id back to App. Database calls go through lib/api.js.

import { useState, useEffect } from "react";
import * as api from "../lib/api";

function CreateGame({ onCreated, onCancel, playerID }) {
  const [error, setError] = useState("");
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    const { data, error } = await api.fetchProfiles();

    if (error) setError(error.message);
    else setProfiles(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Read through .elements: form.name is the form's own name attribute,
    // so e.target.name.value would be undefined here.
    const name = e.target.elements.name.value;
    const description = e.target.elements.description.value;

    const checked = Array.from(
      e.target.querySelectorAll('input[name="players"]:checked')
    ).map((el) => el.value);

    // The creator always joins their own game, whether or not they
    // ticked their own box — otherwise they can't open it afterwards.
    const playerIDs = [...new Set([playerID, ...checked])];

    const { data: game, error: gameError } = await api.createGame({
      name,
      description,
      creator: playerID,
    });

    if (gameError) {
      setError(gameError.message);
      return;
    }

    const { error: playersError } = await api.addPlayersToGame(
      game.id,
      playerIDs
    );

    if (playersError) {
      setError(playersError.message);
      return;
    }

    onCreated(game.id);
  }

  return (
    <>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      <form onSubmit={handleSubmit}>
        <p>Name:</p>
        <input type="text" id="name" name="name" />

        <p>Description:</p>
        <input type="text" id="description" name="description" />

        <p>Players</p>
        {profiles.map((profile) => (
          <label key={profile.id}>
            <input type="checkbox" value={profile.id} name="players" />
            {profile.name}
          </label>
        ))}

        <button type="submit">Create game</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </form>
    </>
  );
}

export default CreateGame;