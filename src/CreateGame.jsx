import { useState, useEffect } from "react"
import { supabase } from "./lib/supabase"

function CreateGame({startGame}) {
    const [error, setError] = useState("");
    const [profiles, setProfiles] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const { data, error } = await supabase
                .from("profiles")
                .select('id, name');
            if (error) {
                setError(error.message);
            } else {
                setProfiles(data);
            }
        }
        fetchData();
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();

        const name = e.target.name.value;
        const description = e.target.description.value;

        const playerIDs = Array.from(
            e.target.querySelectorAll('input[name="players"]:checked')
        ).map(el => el.value);

         // 1. insert the game
             const { data: game, error: gameError } = await supabase
        .from("games")
        .insert({ name, description })
        .select()
        .single();

            if (gameError) {
                setError(gameError.message);
                return;
            }

             // 2. insert one row per selected player
            const rows = playerIDs.map(player_id => ({
                game_id: game.id,
                player_id
            }));

            const { error: playersError } = await supabase
                .from("game_players")
                .insert(rows);

            if (playersError) {
                setError(playersError.message);
            }

            StartGame(game.id);
    }
    return (
        <>
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            <form onSubmit={handleSubmit}>
                <p>Name:</p>
                <input type="text" id="name" name="name" />
                <p>Description:</p>
                <input type="text" id="description" name="description"/>
                <p>Players</p>
                {profiles.map((data) => (
                    <label key={data.id}>
                        <input type="checkbox" value={data.id} name="players"/>
                        {data.name}
                    </label>
                ))}
                <button type="submit">Create Game</button>
            </form>
        </>
    );
}

export default CreateGame;