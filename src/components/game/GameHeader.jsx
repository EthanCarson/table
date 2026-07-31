// GameHeader.jsx
// Read-only summary at the top of a game: name, description, and who
// created it. Purely presentational — it does no fetching of its own.

function GameHeader({ game, playerID, creatorName }) {
  return (
    <>
      <h1>{game.name}</h1>
      <p>Description: {game.description}</p>
      <p>
        {game.creator === playerID
          ? "Created by you"
          : `Created by ${creatorName || "..."}`}
      </p>
    </>
  );
}

export default GameHeader;