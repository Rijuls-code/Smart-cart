import { useEffect, useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000' });

export default function Dashboard() {
  const [stats, setStats] = useState({ activeSessions: 0, products: 0 });
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [sessionsRes, productsRes] = await Promise.all([
          api.get('/sessions'),
          api.get('/products')
        ]);
        setStats({
          activeSessions: sessionsRes.data?.items?.length || 0,
          products: productsRes.data?.items?.length || 0
        });
        setSessions(sessionsRes.data?.items || []);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 animate-fade-up">
        <div className="badge-soft">
          <span className="glow-dot" />
          Live sync is on
        </div>
        <div className="pill good">Realtime overview</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-delayed">
        <div className="card p-5 grid-ghost">
          <div className="panel-title">
            <div className="section-title">Active Sessions</div>
            <span className="pill">Live</span>
          </div>
          <div className="stat-value">{stats.activeSessions}</div>
          <div className="stat-label mt-2">Shopping journeys currently open</div>
        </div>
        <div className="card p-5 grid-ghost">
          <div className="panel-title">
            <div className="section-title">Products</div>
            <span className="pill">Catalog size</span>
          </div>
          <div className="stat-value">{stats.products}</div>
          <div className="stat-label mt-2">Items available for scanning</div>
        </div>
      </div>

      <div className="space-y-4 animate-fade-delayed">
        <div className="panel-title">
          <div className="section-title">Live Sessions</div>
          <div className="pill">{sessions.length} active</div>
        </div>
        <div className="card p-5 grid-ghost">
          <div className="table-wrap">
            <table className="text-sm">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Store</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id.slice(0, 8)}</td>
                    <td>{s.storeId}</td>
                    <td>{s.items?.length || 0}</td>
                    <td>
                      <span className={`pill ${s.payment?.status === 'paid' ? 'good' : ''}`}>
                        {s.payment?.status || 'pending'}
                      </span>
                    </td>
                    <td>{new Date(s.updatedAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
