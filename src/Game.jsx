import { supabase } from "./lib/supabase";
import { useState, useEffect } from "react";

function Game({ gameID, playerID }) {
  const [authenticationError, setAuthenticationError] = useState("");
  const [error, setError] = useState("");
  const [players, setPlayers] = useState([]);
  const [gameData, setGameData] = useState(null);
  const [prepareMessage, setPrepareMessage] = useState(false);
  const [messagedPlayers, setMessagedPlayers] = useState([]);
  const [sender, setSender] = useState("");
  const [message, setMessage] = useState("");
  const [messageID, setMessageID] = useState("");
  const [editGame, setEditGame] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [creatorName, setCreatorName] = useState("");

  useEffect(() => {
    async function checkPlayer() {
      const { error } = await supabase
        .from("game_players")
        .select("*")
        .eq("game_id", gameID)
        .eq("player_id", playerID);

      if (error) setAuthenticationError(error.message);
    }

    checkPlayer();
    fetchPlayerData();
    fetchGameData();
    fetchMessageData();

    // Listen for new notifications in real time
    const channel = supabase
      .channel(`notifications-${playerID}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `reciever_id=eq.${playerID}`,
        },
        (payload) => {
          // Only refetch if you're not already showing a message
          // (fetchMessageData will grab whatever's oldest/first anyway)
          fetchMessageData();
        }
      )
      .subscribe();

    // Cleanup: remove the channel when the component unmounts
    // or when gameID/playerID changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameID, playerID]);

  // Fetch the creator's name once gameData is loaded, but only if
  // the current player isn't the creator (no need to look up your own name)
  useEffect(() => {
    if (gameData && gameData.creator !== playerID) {
      fetchCreatorName();
    }
  }, [gameData, playerID]);

  async function fetchMessageData() {
    const { data, error } = await supabase
      .from("notifications")
      .select("content, id, sender:sender_id(name)")
      .eq("reciever_id", playerID)
      .eq("game_id", gameID)
      .limit(1)
      .maybeSingle();

    if (error) {
      setError(error.message);
    } else if (data) {
      setMessage(data.content);
      setSender(data.sender.name);
      setMessageID(data.id);
    }
  }

  async function fetchPlayerData() {
    // player_id(name) pulls the joined profile row directly,
    // so you don't need a second query per player
    const { data, error } = await supabase
      .from("game_players")
      .select("player_id(id, name)")
      .eq("game_id", gameID);

    if (error) {
      setError(error.message);
      return;
    }

    setPlayers(data.map((row) => row.player_id));
  }

  async function fetchGameData() {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameID)
      .single();

    if (error) setError(error.message);
    else setGameData(data);
  }

  async function submitMessage(reciverID, message) {
    const sender_id = playerID;
    const reciever_id = reciverID;
    const content = message;
    const game_id = gameID;
    const { data, error } = await supabase
      .from("notifications")
      .insert({ sender_id, reciever_id, content, game_id })
      .select()
      .single();

    if (error) {
      setError(error.message); // error is an object; store the message string
    } else {
      window.alert("Success!");
    }
    setPrepareMessage(false); // was [false] — an array is truthy, so the form never actually hid
    setMessagedPlayers([]); // was "" — should stay an array
  }

  async function removeMessage() {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", messageID);

    if (error) {
      setError(error.message);
    } else {
      setMessage("");
      setMessageID("");
      setSender("");
      fetchMessageData(); // <-- pull the next message in the queue
    }
  }

  async function fetchCreatorName() {
    const { data, error } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", gameData.creator)
      .single();

    if (error) {
      setError(error.message);
    } else {
      setCreatorName(data.name);
    }
  }

  async function updateGame(e) {
    e.preventDefault();
    const newName = e.target.name.value;
    const newDescription = e.target.description.value;

    const { error } = await supabase
      .from("games")
      .update({ name: newName, description: newDescription })
      .eq("id", gameID)
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else {
      window.alert("Updated Game!");
      setGameData({ ...gameData, name: newName, description: newDescription });
      setEditGame(false);
    }
  }

  async function deleteGame() {
    const { error } = await supabase.from("games").delete().eq("id", gameID);

    if (error) {
      setError(error.message);
    } else {
      window.alert("Game has been deleted.");
      // TODO: navigate away / notify a parent component here,
      // otherwise the user is left viewing a game that no longer exists
    }
  }

  if (authenticationError) {
    return <div>ERROR: {authenticationError}</div>;
  }

  if (message) {
    return (
      <div>
        {sender ? <h1>{sender} Messaged:</h1> : <h1>Message:</h1>}
        <p>{message}</p>
        <button onClick={() => removeMessage()}>Close Message</button>
      </div>
    );
  }

  if (prepareMessage) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault(); // <-- stops the page reload
          const message = e.target.content.value;
          for (let reciever of messagedPlayers) {
            submitMessage(reciever, message);
          }
        }}
      >
        <input type="text" placeholder="Enter your message here" maxLength={256} name="content" />
        <button type="submit">Submit Message</button>
        <button
          type="button"
          onClick={() => {
            setMessagedPlayers([]);
            setPrepareMessage(false);
          }}
        >
          Cancel
        </button>
      </form>
    );
  }

  if (isDeleting) {
    return (
      <>
        <p>Are you sure you want to delete?</p>
        <button type="button" onClick={() => setIsDeleting(false)}>
          No
        </button>
        <button type="button" onClick={() => deleteGame()}>
          Yes
        </button>
      </>
    );
  }

  if (editGame) {
    return (
      <>
        <form onSubmit={updateGame}>
          <label htmlFor="name">Game Name:</label>
          <input type="text" name="name" defaultValue={gameData.name} />
          <label htmlFor="description">Game Description:</label>
          <input type="text" name="description" defaultValue={gameData.description} />
          <button type="submit">Save Changes</button>
        </form>

        <button type="button" onClick={() => setIsDeleting(true)}>
          Delete Game
        </button>
      </>
    );
  }

  return (
    <>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {gameData && <h1>{gameData.name}</h1>}
      {gameData && <p>Description: {gameData.description}</p>}
      {gameData &&
        (gameData.creator === playerID ? (
          <p>Created by you</p>
        ) : (
          <p>created by {creatorName}</p>
        ))}
      {players.map((player) => (
        <label key={player.id}>
          <button
            onClick={() => {
              setPrepareMessage(true);
              setMessagedPlayers([player.id]);
            }}
          >
            <h1>{player.name}</h1>
          </button>
        </label>
      ))}
      <button
        onClick={() => {
          const playerArray = [];
          for (let p of players) {
            playerArray.push(p.id);
          }

          setPrepareMessage(true);
          setMessagedPlayers(playerArray);
        }}
      >
        Message All
      </button>

      {gameData && gameData.creator === playerID && (
        <button type="button" onClick={() => setEditGame(true)}>
          Edit Game
        </button>
      )}
    </>
  );
}

export default Game;