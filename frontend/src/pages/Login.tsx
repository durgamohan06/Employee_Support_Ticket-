import { useState, type FormEvent } from "react";
import { useAuth } from "../auth.tsx";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("alex.rivera");
  const [password, setPassword] = useState("Demo@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(username, password);
      window.location.href = user.role === "support" ? "/support" : "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <h1>Sign in</h1>
        <p className="muted">Employee Support Ticket Management System</p>
        <form className="form" onSubmit={onSubmit}>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <div className="alert error">{error}</div> : null}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="demo">
          <strong>Demo accounts</strong> (password <code>Demo@123</code>)
          <ul>
            <li>alex.rivera — employee</li>
            <li>jordan.lee — employee</li>
            <li>sam.patel — employee</li>
            <li>support.agent — support staff</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
