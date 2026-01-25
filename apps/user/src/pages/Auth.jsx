import { useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000' });

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter your email');
      return;
    }
    if (!password.trim()) {
      setError('Enter your password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Demo auth: use email as the user ID in our mock API. GET will auto-create on first hit.
      const userId = email.trim().toLowerCase();
      await api.get(`/users/${userId}`);
      onAuth(userId);
    } catch (err) {
      console.error(err);
      setError('Could not reach server. Is the API on port 4000 running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-100 px-4">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-6 items-center">
        <div className="space-y-2 animate-fade-up">
          <div className="logo text-3xl font-bold">🛒 Smart<span className="text-emerald-300">Cart</span></div>
          <h1 className="text-4xl font-semibold">{isLogin ? 'Welcome Back' : 'Join the Future'}</h1>
          <p className="muted text-lg">Scan, pay, and go. Your smart shopping starts here.</p>
          <div className="pill w-fit">User Portal</div>
        </div>

        <div className="card p-6 grid-ghost space-y-4 animate-fade-delayed">
          <div className="panel-title">
            <div>
              <div className="text-sm uppercase tracking-[0.18em] text-slate-300">SmartCart</div>
              <div className="section-title">{isLogin ? 'Sign in' : 'Create account'}</div>
            </div>
            <div className="pill text-xs">Demo only</div>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            {!isLogin && (
              <label className="block text-sm">
                <span className="text-xs text-slate-300">Full name</span>
                <input
                  className="field mt-1"
                  placeholder="Alex Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            )}

            <label className="block text-sm">
              <span className="text-xs text-slate-300">Email</span>
              <input
                className="field mt-1"
                type="email"
                placeholder="you@example.com"
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

            <button className="submit-btn btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Working...' : isLogin ? 'Sign in' : 'Register'}
            </button>
          </form>

          <div className="text-sm text-center text-slate-300">
            {isLogin ? (
              <span>
                New to SmartCart?{' '}
                <button type="button" className="text-emerald-300 font-semibold" onClick={() => setMode('register')}>
                  Create Account
                </button>
              </span>
            ) : (
              <span>
                Already a member?{' '}
                <button type="button" className="text-emerald-300 font-semibold" onClick={() => setMode('login')}>
                  Login Now
                </button>
              </span>
            )}
          </div>

          <div className="text-xs text-slate-400 text-center">
            Demo uses your email as the user ID; real auth can replace this flow. API base: http://localhost:4000
          </div>
        </div>
      </div>
    </div>
  );
}
