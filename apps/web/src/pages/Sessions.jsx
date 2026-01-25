import { useEffect, useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000' });

export default function Sessions() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await api.get('/sessions');
      setSessions(res.data.items || []);
    }
    load();
  }, []);

  return (
    <div className="space-y-4 animate-fade-up">
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
  );
}
