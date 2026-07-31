// Login.jsx
// Email + password sign-in. On success it passes the Supabase user
// object up to App, which is what unlocks the rest of the app.
// The auth call itself lives in lib/api.js.

import { useState } from "react";
import * as api from "../lib/api";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const { data, error } = await api.signIn(email, password);

    if (error) setError("Email or password incorrect.");
    else onLogin(data.user);
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <label htmlFor="email">Email</label>
      <input
        type="email"
        id="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label htmlFor="password">Password</label>
      <input
        type="password"
        id="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit">Log in</button>
    </form>
  );
}

export default Login;