// api.js
// Every Supabase call in the app lives here. Components decide *when* to
// talk to the database; this file is the only place that knows *how*.
//
// Each function returns { data, error } so callers keep the same error
// handling they already had. Reads that involve a join return the shape
// the UI actually wants, not the raw nested row.

import { supabase } from "./supabase";

/* ---------- auth ---------- */

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

/* ---------- games ---------- */

// Games this player belongs to. The query goes through game_players, so
// unwrap row.games before handing it back.
export async function fetchGamesForPlayer(playerID) {
  const { data, error } = await supabase
    .from("game_players")
    .select("games(*)")
    .eq("player_id", playerID);

  return { data: data ? data.map((row) => row.games) : [], error };
}

export async function fetchGame(gameID) {
  return supabase.from("games").select("*").eq("id", gameID).single();
}

export async function createGame({ name, description, creator }) {
  return supabase
    .from("games")
    .insert({ name, description, creator })
    .select()
    .single();
}

export async function updateGame(gameID, { name, description }) {
  // .select().single() forces the update to report what actually
  // changed. Without it, an RLS policy that matches zero rows still
  // returns {error: null} — indistinguishable from success — and the
  // caller ends up updating local state for a write that never happened.
  return supabase
    .from("games")
    .update({ name, description })
    .eq("id", gameID)
    .select()
    .single();
}

export async function deleteGame(gameID) {
  return supabase.from("games").delete().eq("id", gameID);
}

/* ---------- players and profiles ---------- */

export async function fetchProfiles() {
  return supabase.from("profiles").select("id, name");
}

export async function fetchProfileName(playerID) {
  const { data, error } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", playerID)
    .single();

  return { data: data?.name ?? "", error };
}

// player_id(id, name) pulls the joined profile row directly, so there's
// no second query per player.
export async function fetchGamePlayers(gameID) {
  const { data, error } = await supabase
    .from("game_players")
    .select("player_id(id, name)")
    .eq("game_id", gameID);

  return { data: data ? data.map((row) => row.player_id) : [], error };
}

export async function addPlayersToGame(gameID, playerIDs) {
  const rows = playerIDs.map((player_id) => ({ game_id: gameID, player_id }));
  return supabase.from("game_players").insert(rows);
}

export async function deleteGamePlayers(gameID) {
  return supabase.from("game_players").delete().eq("game_id", gameID).select();
}

// Full-replace strategy: wipe the roster and reinsert the new one. Awaits
// the delete before inserting, so the two steps can't race, and verifies
// the delete actually matched rows — an RLS policy that silently filters
// everything out looks identical to "nothing to delete" otherwise, and
// the insert below would then duplicate the existing roster instead of
// replacing it.
export async function updateGamePlayers({ gameID, playerIDs }) {
  const { data: deletedRows, error: deleteError } = await deleteGamePlayers(gameID);
  if (deleteError) return { error: deleteError };

  const { data: previousPlayers } = await fetchGamePlayers(gameID);
  if (previousPlayers.length > 0 && deletedRows.length === 0) {
    return {
      error: {
        message:
          "Roster update blocked: existing players weren't deleted (likely an RLS policy mismatch). Aborting to avoid duplicate rows.",
      },
    };
  }

  if (playerIDs.length === 0) return { error: null };

  // One batch insert instead of one round trip per player.
  const { error: insertError } = await addPlayersToGame(gameID, playerIDs);
  return { error: insertError };
}

// Returns { data: true | false } rather than a row — callers only care
// whether the player is allowed in.
export async function isPlayerInGame(gameID, playerID) {
  const { data, error } = await supabase
    .from("game_players")
    .select("player_id")
    .eq("game_id", gameID)
    .eq("player_id", playerID)
    .maybeSingle();

  return { data: Boolean(data), error };
}

/* ---------- messages ---------- */
// Note: the notifications table column is spelled "reciever_id". Keeping
// the queries in one file means that typo only exists here.

// The oldest message waiting for this player in this game, flattened to
// { id, content, senderName }, or null if there's nothing waiting.
export async function fetchNextMessage(gameID, playerID) {
  const { data, error } = await supabase
    .from("notifications")
    .select("content, id, sender:sender_id(name)")
    .eq("reciever_id", playerID)
    .eq("game_id", gameID)
    .limit(1)
    .maybeSingle();

  if (error || !data) return { data: null, error };

  return {
    data: { id: data.id, content: data.content, senderName: data.sender?.name },
    error: null,
  };
}

// One insert covering every recipient, rather than a round trip each.
export async function sendMessage({ gameID, senderID, recipientIDs, content }) {
  const rows = recipientIDs.map((reciever_id) => ({
    sender_id: senderID,
    reciever_id,
    content,
    game_id: gameID,
  }));

  return supabase.from("notifications").insert(rows);
}

export async function deleteMessage(messageID) {
  return supabase.from("notifications").delete().eq("id", messageID);
}

/* ---------- realtime ---------- */
// Both subscriptions return their own cleanup function, so a component
// can just `return subscribeTo...(...)` from a useEffect.

export function subscribeToMessages(playerID, onMessage) {
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
      onMessage
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function subscribeToGameInvites(playerID, onInvite) {
  const channel = supabase
    .channel(`game_players-${playerID}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "game_players",
        filter: `player_id=eq.${playerID}`,
      },
      onInvite
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}