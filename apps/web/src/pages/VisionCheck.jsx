import { useState } from 'react';

const API_BASE = 'http://localhost:4000';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function VisionCheck() {
  const [sessionId, setSessionId] = useState('');
  const [billedItemsText, setBilledItemsText] = useState('');
  const [cartImage, setCartImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setCartImage(dataUrl);
  }

  async function runCheck() {
    if (!cartImage) {
      setError('Please add a cart photo.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      let billedItems = [];
      if (billedItemsText.trim()) {
        try {
          billedItems = JSON.parse(billedItemsText);
        } catch (_err) {
          setError('Billed items JSON is invalid');
          setLoading(false);
          return;
        }
      }
      const res = await fetch(`${API_BASE}/vision/cart-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartImage, billedItems, sessionId: sessionId || undefined })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Vision check failed');
      }
      setResult(data.vision?.result || data.vision || data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Vision check failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="panel-title animate-fade-up">
        <div className="section-title">Gemini Vision Cart Check</div>
        <div className="pill">Upload cart photo + billed items</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-delayed">
        <div className="card p-5 grid-ghost space-y-3">
          <div className="section-title text-sm">Inputs</div>
          <label className="text-xs text-slate-300">Session ID (optional)</label>
          <input className="field" placeholder="session id" value={sessionId} onChange={(e) => setSessionId(e.target.value)} />

          <label className="text-xs text-slate-300">Billed items JSON (optional)</label>
          <textarea
            className="field h-32"
            placeholder='[{"name":"Milk","qty":1,"price":60}]'
            value={billedItemsText}
            onChange={(e) => setBilledItemsText(e.target.value)}
          />

          <label className="text-xs text-slate-300">Cart photo</label>
          <input type="file" accept="image/*" onChange={handleFile} className="text-sm" />
          {cartImage && <img src={cartImage} alt="Cart" className="mt-2 w-full rounded-lg border border-slate-700" />}

          <button className="btn-primary w-full" onClick={runCheck} disabled={loading}>
            {loading ? 'Checking...' : 'Run vision check'}
          </button>
          {error && <div className="text-sm text-rose-300">{error}</div>}
        </div>

        <div className="lg:col-span-2 card p-5 grid-ghost space-y-3">
          <div className="panel-title">
            <div className="section-title text-sm">Result</div>
            <small className="muted">Gemini structured response</small>
          </div>
          {result ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="card p-3 card-strong">
                <div className="flex items-center justify-between">
                  <div className="section-title text-sm">Match</div>
                  <div className={`pill ${result.isMatch ? 'good' : ''}`}>{String(result.isMatch)}</div>
                </div>
                <div className="muted text-sm mt-2">{result.reason}</div>
              </div>

              <div className="card p-3">
                <div className="section-title text-sm">Missing from bill</div>
                <ul className="text-sm text-slate-200 space-y-1">
                  {(result.missingFromBill || []).map((i, idx) => (
                    <li key={idx}>• {i}</li>
                  ))}
                  {!result.missingFromBill?.length && <li className="muted">None</li>}
                </ul>
              </div>

              <div className="card p-3">
                <div className="section-title text-sm">Missing from cart</div>
                <ul className="text-sm text-slate-200 space-y-1">
                  {(result.missingFromCart || []).map((i, idx) => (
                    <li key={idx}>• {i}</li>
                  ))}
                  {!result.missingFromCart?.length && <li className="muted">None</li>}
                </ul>
              </div>

              <div className="card p-3">
                <div className="section-title text-sm">Quantity mismatches</div>
                <ul className="text-sm text-slate-200 space-y-1">
                  {(result.quantityMismatch || []).map((i, idx) => (
                    <li key={idx}>• {i}</li>
                  ))}
                  {!result.quantityMismatch?.length && <li className="muted">None</li>}
                </ul>
              </div>
            </div>
          ) : (
            <div className="muted">Awaiting a vision check...</div>
          )}
        </div>
      </div>
    </div>
  );
}
