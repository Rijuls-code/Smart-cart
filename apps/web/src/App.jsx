import { useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import QrScanner from './pages/QrScanner.jsx';
import VisionCheck from './pages/VisionCheck.jsx';
import AdminLogin from './pages/AdminLogin.jsx';

function Nav({ adminEmail, onLogout }) {
  const items = [
    { to: '/', label: 'Dashboard' },
    { to: '/products', label: 'Products' },
    { to: '/scanner', label: 'QR Scanner' },
    { to: '/vision', label: 'Vision Check' }
  ];
  return (
    <header className="glass-nav">
      <div className="mx-auto max-w-6xl px-4 py-3 flex gap-6 items-center justify-between">
        <div className="brand-mark">
          <span className="brand-dot" />
          <div>
            <div className="text-sm uppercase tracking-[0.18em] text-slate-300">Store OS</div>
            <div className="text-base font-semibold text-white">Admin Console</div>
          </div>
        </div>
        <nav className="flex gap-2 text-sm items-center">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-pill ${isActive ? 'nav-pill--active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
          <div className="flex items-center gap-2">
            {adminEmail && <span className="pill text-xs">{adminEmail}</span>}
            <button className="btn-ghost text-xs" onClick={onLogout}>
              Logout
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('adminAuth');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch (err) {
      console.error('Failed to parse adminAuth', err);
      return null;
    }
  });

  function handleLogin(payload) {
    const record = { email: payload.email, loggedInAt: Date.now() };
    localStorage.setItem('adminAuth', JSON.stringify(record));
    setAdmin(record);
  }

  function handleLogout() {
    localStorage.removeItem('adminAuth');
    setAdmin(null);
  }

  if (!admin) {
    return (
      <div className="min-h-screen text-slate-100 relative">
        <div className="floating-dots" />
        <main className="page-shell">
          <AdminLogin onLogin={handleLogin} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 relative">
      <div className="floating-dots" />
      <Nav adminEmail={admin?.email} onLogout={handleLogout} />
      <main className="page-shell">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sessions" element={<Dashboard />} />
          <Route path="/scanner" element={<QrScanner />} />
          <Route path="/vision" element={<VisionCheck />} />
        </Routes>
      </main>
    </div>
  );
}
