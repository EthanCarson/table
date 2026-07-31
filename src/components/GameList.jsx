// GameList.jsx
// The home screen list of games you belong to. Each entry is a button
// that opens that game.

function GameList({ games, onOpenGame }) {
  if (games.length === 0) {
    return <p>You aren't in any games yet. Make one below.</p>;
  }

  return (
    <ul>
      {games.map((game) => (
        <li key={game.id}>
          <button type="button" onClick={() => onOpenGame(game.id)}>
            <h2>{game.name}</h2>
            <p>Description: {game.description}</p>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default GameList;