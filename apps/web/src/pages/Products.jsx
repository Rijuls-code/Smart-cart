import { useEffect, useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000' });

export default function Products() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ barcode: '', name: '', price: '', taxRate: 0, stock: 0 });

  async function load() {
    const res = await api.get('/products');
    setItems(res.data.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    await api.post('/products', { ...form, price: Number(form.price), taxRate: Number(form.taxRate), stock: Number(form.stock) });
    setForm({ barcode: '', name: '', price: '', taxRate: 0, stock: 0 });
    load();
  }

  async function remove(barcode) {
    const confirmed = window.confirm(`Delete product ${barcode}?`);
    if (!confirmed) return;
    await api.delete(`/products/${encodeURIComponent(barcode)}`);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-up">
        <div>
          <div className="section-title">Products</div>
          <div className="muted">Manage your shelf with quick edits and live sync.</div>
        </div>
        <div className="pill good">{items.length} items</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-delayed">
        <div className="md:col-span-2 card p-5 grid-ghost">
          <div className="panel-title">
            <div className="section-title">Catalog</div>
            <small>Hover rows to see actions</small>
          </div>
          <div className="table-wrap">
            <table className="text-sm">
              <thead>
                <tr>
                  <th>Barcode</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Tax</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.barcode}>
                    <td>{p.barcode}</td>
                    <td>{p.name}</td>
                    <td>₹{p.price}</td>
                    <td>{(p.taxRate * 100).toFixed(1)}%</td>
                    <td>{p.stock}</td>
                    <td>
                      <button className="btn-ghost text-rose-300 px-3 py-1" onClick={() => remove(p.barcode)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card p-5 grid-ghost">
          <div className="panel-title">
            <div className="section-title">Add / Update</div>
            <small>Autofills overwrite existing</small>
          </div>
          <form className="space-y-3" onSubmit={save}>
            <input className="field" placeholder="Barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} required />
            <input className="field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="field" type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <input className="field" type="number" step="0.01" placeholder="Tax rate (0.05)" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
            <input className="field" type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            <button className="btn-primary w-full" type="submit">
              Save product
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
