import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'
import CreateGame from './CreateGame'
import Game from './Game'

function App() {
  const [games, setGames] = useState([])
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [creatingGame, setCreatingGame] = useState(false);
  const [game, setGame] = useState("");

async function fetchGames() {
    const { data, error } = await supabase
      .from('game_players')
      .select('games(*)')
      .eq("player_id", user.id)

    if (error) setError(error.message)
    else setGames(data)
  }

useEffect(() => {
  if (!user) return
  fetchGames()

  const channel = supabase
    .channel(`game_players-${user.id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "game_players",
        filter: `player_id=eq.${user.id}`,
      },
      (payload) => {
        fetchGames()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [user])

  console.log('rendering App, user is:', user)

  if (!user) {
    return <Login onLogin={setUser} />
  }

 if (creatingGame) {
    return <CreateGame startGame={() => {
      setCreatingGame(false)
      fetchGames()
    }} playerID={user.id} />
  }

if (game) {
    return <Game gameID={game} playerID={user.id} />
}

  return (
    <div>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {games.map((row) => {
      const game = row.games;
      return (
        <button onClick={()=>setGame(game.id)}>
        <label key={game.id}>
          <h1>{game.name}</h1>
          <p>Description: {game.description}</p>
        </label>
        </button>
      );
    })}
      <button onClick={() => setCreatingGame(true)}>Make new game</button>
    </div>
  )
}

export default App