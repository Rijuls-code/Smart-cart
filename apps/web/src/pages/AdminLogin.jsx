import { useState } from 'react';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Enter email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // No real backend auth yet; this simply stores the email locally.
      onLogin({ email: email.trim() });
    } catch (err) {
      console.error(err);
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-lg w-full">
        <div className="card p-6 grid-ghost space-y-5">
          <div className="panel-title">
            <div>
              <div className="text-sm uppercase tracking-[0.18em] text-slate-300">Admin Console</div>
              <div className="section-title">Sign in</div>
            </div>
            <div className="pill">Local only</div>
          </div>

          <p className="muted text-sm">
            Authenticate to access the admin dashboards. This demo stores the email in localStorage; hook it up to your auth
            provider when ready.
          </p>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <label className="block text-sm">
              <span className="text-xs text-slate-300">Work email</span>
              <input
                className="field mt-1"
                type="email"
                placeholder="admin@store.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-xs text-slate-300">Password</span>
              <input
                className="field mt-1"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && <div className="text-sm text-rose-300">{error}</div>}
            <button className="btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="text-xs text-slate-400">
            Tip: Replace this stub with your auth API and redirect back here after verifying credentials.
          </div>
        </div>
      </div>
    </div>
  );
}
