// Game.jsx
// Container for a single game. It owns the state, decides which sub-view
// to show, and reacts to what the user does. It doesn't write queries —
// every database call goes through lib/api.js.
//
// Naming: load* functions pull data in, handle* functions respond to
// something the user did.

import { useState, useEffect } from "react";
import * as api from "../../lib/api";
import GameHeader from "./GameHeader";
import PlayerList from "./PlayerList";
import MessageView from "./MessageView";
import MessageForm from "./MessageForm";
import EditGameForm from "./EditGameForm";

function Game({ gameID, playerID, onExit }) {
  const [authenticationError, setAuthenticationError] = useState("");
  const [error, setError] = useState("");
  const [players, setPlayers] = useState([]);
  const [gameData, setGameData] = useState(null);
  const [creatorName, setCreatorName] = useState("");
  const [editing, setEditing] = useState(false);

  // The oldest unread message for this player in this game, or null.
  // Shape: { id, content, senderName }
  const [incoming, setIncoming] = useState(null);

  // Who a new message is being composed for. null means "not composing",
  // which replaces the old separate prepareMessage flag.
  const [recipients, setRecipients] = useState(null);

  useEffect(() => {
    loadMembership();
    loadPlayers();
    loadGame();
    loadNextMessage();

    // Returns its own cleanup, so the subscription is torn down when
    // gameID/playerID change or the component unmounts.
    return api.subscribeToMessages(playerID, loadNextMessage);
  }, [gameID, playerID]);

  // Look up the creator's name once the game row arrives, but only if
  // you aren't the creator (no need to look up your own name).
  useEffect(() => {
    if (gameData && gameData.creator !== playerID) loadCreatorName();
  }, [gameData, playerID]);

  async function loadMembership() {
    const { data: isMember, error } = await api.isPlayerInGame(gameID, playerID);

    if (error) setAuthenticationError(error.message);
    else if (!isMember) setAuthenticationError("You are not a player in this game.");
  }

  async function loadPlayers() {
    const { data, error } = await api.fetchGamePlayers(gameID);

    if (error) setError(error.message);
    else setPlayers(data);
  }

  async function loadGame() {
    const { data, error } = await api.fetchGame(gameID);

    if (error) setError(error.message);
    else setGameData(data);
  }

  async function loadCreatorName() {
    const { data, error } = await api.fetchProfileName(gameData.creator);

    if (error) setError(error.message);
    else setCreatorName(data);
  }

  async function loadNextMessage() {
    const { data, error } = await api.fetchNextMessage(gameID, playerID);

    if (error) setError(error.message);
    else setIncoming(data);
  }

  async function handleSendMessage(content) {
    const { error } = await api.sendMessage({
      gameID,
      senderID: playerID,
      recipientIDs: recipients,
      content,
    });

    if (error) setError(error.message);
    else window.alert("Message sent.");

    setRecipients(null);
  }

  async function handleDismissMessage() {
    const { error } = await api.deleteMessage(incoming.id);

    if (error) {
      setError(error.message);
    } else {
      setIncoming(null);
      loadNextMessage(); // pull the next message in the queue
    }
  }

  async function handleSaveGame(name, description) {
    const { error } = await api.updateGame(gameID, { name, description });

    if (error) {
      setError(error.message);
    } else {
      setGameData({ ...gameData, name, description });
      setEditing(false);
    }
  }

  async function handleDeleteGame() {
    const { error } = await api.deleteGame(gameID);

    if (error) setError(error.message);
    else onExit(); // hand control back to App so the list refreshes
  }

  if (authenticationError) {
    return <div>Error: {authenticationError}</div>;
  }

  if (incoming) {
    return (
      <MessageView
        senderName={incoming.senderName}
        content={incoming.content}
        onClose={handleDismissMessage}
      />
    );
  }

  if (recipients && recipients.length > 0) {
    return (
      <MessageForm
        recipientCount={recipients.length}
        onSend={handleSendMessage}
        onCancel={() => setRecipients(null)}
      />
    );
  }

  if (editing && gameData) {
    return (
      <EditGameForm
        game={gameData}
        onSave={handleSaveGame}
        onDelete={handleDeleteGame}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <button type="button" onClick={onExit}>
        Back to games
      </button>

      {gameData && (
        <GameHeader
          game={gameData}
          playerID={playerID}
          creatorName={creatorName}
        />
      )}

      <PlayerList
        players={players}
        onMessagePlayer={(id) => setRecipients([id])}
        onMessageAll={() => setRecipients(players.map((p) => p.id))}
      />

      {gameData && gameData.creator === playerID && (
        <button type="button" onClick={() => setEditing(true)}>
          Edit game
        </button>
      )}
    </>
  );
}

export default Game;