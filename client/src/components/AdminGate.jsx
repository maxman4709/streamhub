import { useEffect, useState } from 'react';
import { api, getToken, setToken, clearToken } from '../api';

export default function AdminGate({ children }) {
  const [authed, setAuthed] = useState(!!getToken());
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // server restarts wipe in-memory sessions — when an authenticated request
  // comes back 401, the saved token is stale; bounce back to the login form
  useEffect(() => {
    function onExpired() {
      setAuthed(false);
      setPassword('');
      setError('Your session expired (server restarted). Please sign in again.');
    }
    window.addEventListener('streamhub:session-expired', onExpired);
    return () => window.removeEventListener('streamhub:session-expired', onExpired);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api.login(password);
      setToken(token);
      setAuthed(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    api.logout();
    clearToken();
    setAuthed(false);
    setPassword('');
  }

  if (!authed) {
    return (
      <div className="admin-login">
        <form className="admin-login-card" onSubmit={handleSubmit}>
          <h2>Admin sign-in</h2>
          <p className="text-dim">Enter the admin password to manage videos, cast, channels and categories.</p>
          {error && <div className="banner error">{error}</div>}
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !password}>
            {loading ? 'Checking…' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-session-bar">
        <span>Signed in as admin</span>
        <button className="btn btn-secondary" onClick={handleLogout}>Sign out</button>
      </div>
      {children}
    </div>
  );
}
