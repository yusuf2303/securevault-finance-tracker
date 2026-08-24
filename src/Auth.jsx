import { useState } from "react"
import { supabase } from "./supabaseClient"

function Auth() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage("")

    let response
if (isSignUp) {
 response = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: window.location.origin
  }
})
    } else {
      response = await supabase.auth.signInWithPassword({
        email,
        password
      })
    }

    const { data, error } = response

    if (error) {
      setMessage(error.message)
    } else if (isSignUp && !data.session) {
      setMessage("Check your email to confirm your account.")
    }

    setLoading(false)
  }

  function changeMode() {
    setIsSignUp(!isSignUp)
    setMessage("")
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>SecureVault</h1>
        <h2>{isSignUp ? "Create Account" : "Welcome Back"}</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />

          <button type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isSignUp
                ? "Create Account"
                : "Log In"}
          </button>
        </form>

        <button type="button" onClick={changeMode}>
          {isSignUp
            ? "Already have an account? Log in"
            : "Need an account? Sign up"}
        </button>

        {message && <p>{message}</p>}
      </section>
    </main>
  )
}

export default Auth