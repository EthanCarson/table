// PlayerList.jsx
// Lists everyone in the game. Clicking a name starts a message to that
// player; "Message all" starts one to everybody. It only reports the
// choice upward — Game decides what to do with it.

function PlayerList({ players, onMessagePlayer, onMessageAll }) {
  if (players.length === 0) {
    return <p>No players in this game yet.</p>;
  }

  return (
    <>
      <h2>Players</h2>
      <ul>
        {players.map((player) => (
          <li key={player.id}>
            <button type="button" onClick={() => onMessagePlayer(player.id)}>
              {player.name}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onMessageAll}>
        Message all
      </button>
    </>
  );
}

export default PlayerList;