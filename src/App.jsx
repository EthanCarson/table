import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'
import CreateGame from './CreateGame'

function App() {
  const [games, setGames] = useState([])
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [creatingGame, setCreatingGame] = useState(false);

  useEffect(() => {
    console.log('useEffect fired, current user:', user)

    if (!user) return

    async function fetchData() {
      const { data, error } = await supabase
        .from('game_players')
        .select('games(*)')
        .eq("player_id", user.id)
      console.log('fetch result — data:', data, 'error:', error)

      if (error) {
        setError(error.message)
      } else {
        setGames(data)
      }
    }
    fetchData()
  }, [user])

  console.log('rendering App, user is:', user)

  if (!user) {
    return <Login onLogin={setUser} />
  }

  if (creatingGame) {
    return <CreateGame createGame={() => {setCreatingGame(false);}}></CreateGame>
  }

  return (
    <div>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {games.map((row) => {
      const game = row.games;
      return (
        <label key={game.id}>
          <h1>{game.name}</h1>
          <p>Description: {game.description}</p>
        </label>
      );
    })}
      <button onClick={() => setCreatingGame(true)}>Make new game</button>
    </div>
  )
}

export default App