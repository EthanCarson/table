
import { useState } from "react"
import { supabase } from './lib/supabase'
function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
  e.preventDefault()
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})

if (error) {
  window.alert("Username or password incorrect.");
} else {
  onLogin(data.user);
}
}
   
    return(
        <form onSubmit={handleSubmit}>
              <input
  type="text"
  id="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}>

  </input>
       <input
  type="password"
  id="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
<button type="submit">Log In</button>
        </form>
    )
 }

 export default Login;