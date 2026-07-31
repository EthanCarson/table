// App.jsx
// Root component. Holds the logged-in user and the list of games they
// belong to, and switches between the four top-level screens:
// login, game list, create game, and a single game.
// Database calls go through lib/api.js.

import { useEffect, useState } from "react";
import * as api from "./lib/api";
import Login from "./components/Login";
import CreateGame from "./components/CreateGame";
import GameList from "./components/GameList";
import Game from "./components/game/Game";

function App() {
  const [games, setGames] = useState([]);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [creatingGame, setCreatingGame] = useState(false);
  const [openGameID, setOpenGameID] = useState("");

  async function loadGames() {
    const { data, error } = await api.fetchGamesForPlayer(user.id);

    if (error) setError(error.message);
    else setGames(data);
  }

  useEffect(() => {
    if (!user) return;
    loadGames();

    // Refresh the list whenever someone adds you to a game.
    return api.subscribeToGameInvites(user.id, loadGames);
  }, [user]);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (creatingGame) {
    return (
      <CreateGame
        playerID={user.id}
        onCancel={() => setCreatingGame(false)}
        onCreated={(newGameID) => {
          setCreatingGame(false);
          loadGames();
          setOpenGameID(newGameID); // jump straight into the new game
        }}
      />
    );
  }

  if (openGameID) {
    return (
      <Game
        gameID={openGameID}
        playerID={user.id}
        // Called when you back out of a game or delete it, so the list is
        // never left showing a game that no longer exists.
        onExit={() => {
          setOpenGameID("");
          loadGames();
        }}
      />
    );
  }

  return (
    <div>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      <GameList games={games} onOpenGame={setOpenGameID} />
      <button type="button" onClick={() => setCreatingGame(true)}>
        Make new game
      </button>
    </div>
  );
}

export default App;