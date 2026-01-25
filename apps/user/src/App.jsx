import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import Auth from './pages/Auth.jsx';

const api = axios.create({ baseURL: 'http://localhost:4000' });

function Section({ title, hint, badge, children, className = '' }) {
  return (
    <section className={`card p-5 grid-ghost animate-fade-up ${className}`}>
      <div className="panel-title">
        <div>
          <div className="section-title">{title}</div>
          {hint && <div className="muted text-xs mt-1">{hint}</div>}
        </div>
        {badge && <div className="pill">{badge}</div>}
      </div>
      {children}
    </section>
  );
}

export default function App() {
  const persistedUserId = localStorage.getItem('userId');
  const [userId, setUserId] = useState(persistedUserId || 'demo-user');
  const [authed, setAuthed] = useState(Boolean(persistedUserId));
  const [storeId, setStoreId] = useState('store-1');
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId') || '');
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState('');
  const [qty, setQty] = useState(1);
  const [session, setSession] = useState(null);
  const [qrPayload, setQrPayload] = useState(null);
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState('');
  const [credits, setCredits] = useState(0);
  const [piggyBank, setPiggyBank] = useState(0);
  const [coupons, setCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState('');
  const [creditsToRedeem, setCreditsToRedeem] = useState(0);
  const [paymentQuote, setPaymentQuote] = useState(null);
  const [scanSupport, setScanSupport] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [lastScan, setLastScan] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const scanFrameRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    api.get('/products').then((res) => setProducts(res.data.items || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (sessionId && authed) refreshSession();
  }, [authed, sessionId]);

  useEffect(() => {
    setScanSupport('BarcodeDetector' in window);
    return () => stopScanner();
  }, []);

  useEffect(() => {
    if (!authed || !userId) return;
    loadUserData(userId);
  }, [authed, userId]);

  async function loadUserData(targetUserId = userId) {
    if (!targetUserId) return;
    try {
      const [userRes, couponRes] = await Promise.all([
        api.get(`/users/${targetUserId}`),
        api.get(`/user-coupons/${targetUserId}`)
      ]);
      setCredits(userRes.data?.credits || 0);
      setPiggyBank(userRes.data?.piggyBank || 0);
      const list = couponRes.data?.items || [];
      setCoupons(list);
      if (!list.find((c) => c.code === selectedCoupon)) {
        setSelectedCoupon('');
      }
      setCreditsToRedeem(0);
    } catch (err) {
      console.error(err);
      setError('Could not load rewards data');
    }
  }

  function handleAuthSuccess(id) {
    const normalized = id.trim() || 'demo-user';
    setUserId(normalized);
    setAuthed(true);
    localStorage.setItem('userId', normalized);
    setStatus('Logged in');
    loadUserData(normalized);
  }

  function handleLogout() {
    setAuthed(false);
    setUserId('');
    localStorage.removeItem('userId');
    endSession();
    setCoupons([]);
    setSelectedCoupon('');
    setCredits(0);
    setPiggyBank(0);
    setSession(null);
    setQrPayload(null);
    setPaymentQuote(null);
    setStatus('Logged out');
    setError('');
  }

  async function startSession() {
    try {
      setError('');
      const res = await api.post('/sessions', { storeId }, { headers: { 'x-user-id': userId } });
      setSessionId(res.data.id);
      localStorage.setItem('sessionId', res.data.id);
      setSession(res.data);
      setQrPayload(null);
      setStatus('Session started');
      loadUserData(userId);
    } catch (err) {
      console.error(err);
      setError('Could not start session');
    }
  }

  async function refreshSession() {
    if (!sessionId) return;
    try {
      const res = await api.get(`/sessions/${sessionId}`);
      setSession(res.data);
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 404) {
        setSessionId('');
        localStorage.removeItem('sessionId');
        setSession(null);
        setStatus('Session expired or missing, please start a new one');
      } else {
        setError('Failed to load session');
      }
    }
  }

  async function addItem() {
    if (!sessionId) return setError('Start a session first');
    const product = products.find((p) => p.barcode === selected);
    if (!product) return setError('Select a product');
    try {
      setError('');
      const res = await api.post(`/sessions/${sessionId}/scan`, {
        barcode: product.barcode,
        name: product.name,
        price: product.price,
        taxRate: product.taxRate,
        qty: Number(qty)
      });
      setSession(res.data);
      setStatus('Item added');
    } catch (err) {
      console.error(err);
      setError('Failed to add item');
    }
  }

  async function addBarcodeToCart(barcode) {
    if (!sessionId) return setError('Start a session first');
    const product = products.find((p) => p.barcode === barcode);
    if (!product) {
      setError(`Product ${barcode} not found in catalog`);
      return;
    }
    try {
      setError('');
      const res = await api.post(`/sessions/${sessionId}/scan`, {
        barcode: product.barcode,
        name: product.name,
        price: product.price,
        taxRate: product.taxRate,
        qty: 1
      });
      setSession(res.data);
      setStatus(`Scanned ${product.name}`);
    } catch (err) {
      console.error(err);
      setError('Failed to add scanned item');
    }
  }

  async function removeItem(barcode) {
    if (!sessionId) return setError('Start a session first');
    try {
      setError('');
      const res = await api.delete(`/sessions/${sessionId}/item/${barcode}`);
      setSession(res.data);
      setStatus('Item removed');
    } catch (err) {
      console.error(err);
      setError('Failed to remove item');
    }
  }

  async function payAndQr() {
    if (!sessionId) return setError('Start a session first');
    try {
      setError('');
      setQrPayload(null);
      setStatus('Processing payment...');
      const payRes = await api.post(
        `/sessions/${sessionId}/pay`,
        { paymentRef: 'demo', couponCode: selectedCoupon, creditsToUse: Number(creditsToRedeem) || 0 },
        { headers: { 'x-user-id': userId } }
      );
      setSession(payRes.data.session);
      setPaymentQuote(payRes.data.payment);
      setCredits(payRes.data.user?.credits ?? credits);
      setPiggyBank(payRes.data.user?.piggyBank ?? piggyBank);
      await loadUserData(userId);

      const qrRes = await api.post(`/sessions/${sessionId}/qr`);
      setQrPayload(qrRes.data.qrPayload);
      setStatus('Paid and QR generated');
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || err?.message || 'Payment or QR failed';
      setError(`${msg}. Ensure items are in cart and payment succeeded.`);
      setStatus('Idle');
    }
  }

  function endSession() {
    setSessionId('');
    localStorage.removeItem('sessionId');
    setSession(null);
    setQrPayload(null);
    setStatus('Session cleared');
    stopScanner();
  }

  const total = useMemo(() => {
    if (!session?.items) return 0;
    return session.items.reduce((acc, i) => acc + i.price * i.qty * (1 + (i.taxRate || 0)), 0);
  }, [session]);

  const activeCoupon = coupons.find((c) => c.code === selectedCoupon);
  const couponDiscountPreview = activeCoupon ? Math.min(activeCoupon.type === 'percent' ? total * activeCoupon.value : activeCoupon.value, total) : 0;
  const creditsPreview = Math.max(0, Math.min(Number(creditsToRedeem) || 0, credits, total - couponDiscountPreview));
  const payablePreview = Math.max(total - couponDiscountPreview - creditsPreview, 0);
  const cashbackPreview = Math.round(payablePreview * 0.02 * 100) / 100;
  const piggyPreview = Math.round(Math.max(0, Math.ceil(payablePreview / 10) * 10 - payablePreview) * 100) / 100;

  function stopScanner() {
    setScanning(false);
    if (scanFrameRef.current) {
      cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    const tracks = streamRef.current?.getTracks?.() || videoRef.current?.srcObject?.getTracks?.();
    tracks?.forEach((t) => t.stop());
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }

  async function scanLoop() {
    const detector = detectorRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!detector || !video || !canvas) return;
    if (!video.videoWidth || !video.videoHeight) {
      scanFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    try {
      const codes = await detector.detect(canvas);
      if (codes.length) {
        const code = codes[0].rawValue;
        if (code && code !== lastScan) {
          setLastScan(code);
          addBarcodeToCart(code);
        }
      }
    } catch (err) {
      console.error('Scan failed', err);
    }
    scanFrameRef.current = requestAnimationFrame(scanLoop);
  }

  async function startScanner() {
    if (!scanSupport) {
      setCameraError('Barcode scanning is not supported in this browser.');
      return;
    }
    if (!sessionId) return setError('Start a session first');
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      detectorRef.current = detectorRef.current || new window.BarcodeDetector({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e']
      });
      setScanning(true);
      setStatus('Scanner active');
      scanFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (err) {
      console.error(err);
      setCameraError('Could not access camera.');
      stopScanner();
    }
  }

  if (!authed) {
    return <Auth onAuth={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen text-slate-100 relative">
      <div className="floating-dots" />
      <header className="glass-nav">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="brand-mark">
            <span className="brand-dot" />
            <div>
              <div className="text-sm uppercase tracking-[0.18em] text-slate-300">Smart Cart</div>
              <div className="text-base font-semibold text-white">User Portal</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="pill">User: {userId || '—'}</div>
            <div className="pill">Credits: ₹{credits.toFixed(2)}</div>
            <div className="pill">Piggy bank: ₹{piggyBank.toFixed(2)}</div>
            <div className="pill">Status: {status}</div>
            <button className="btn-ghost text-xs" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="page-shell space-y-5">
        <div className="flex flex-wrap items-center gap-3 animate-fade-up">
          <div className="badge-soft">
            <span className="glow-dot" />
            Connected to store
          </div>
          {sessionId && <div className="pill">Session {sessionId.slice(0, 8)}...</div>}
          {lastScan && <div className="pill good">Last scan: {lastScan}</div>}
        </div>

        <Section title="Store & Session" hint="Start a shopping session tied to your store">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <input
              className="field w-full sm:w-52"
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <input
              className="field w-full sm:w-52"
              placeholder="Store ID"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
            />
            <button className="btn-primary" onClick={startSession}>
              Start session
            </button>
            {sessionId && (
              <button className="btn-ghost text-rose-200" onClick={endSession}>
                End session
              </button>
            )}
          </div>
        </Section>

        <Section title="Scan / Add Item" hint="Select from catalog or scan with camera" className="animate-fade-delayed">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <select
              className="field"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.barcode} value={p.barcode}>
                  {p.name} — ₹{p.price}
                </option>
              ))}
            </select>
            <input
              className="field"
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <button className="btn-primary" onClick={addItem}>
              Add to cart
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2 card p-4 grid-ghost">
              <div className="panel-title">
                <div className="section-title text-base">Camera barcode scanner</div>
                <small className="pill">Experimental</small>
              </div>
              <div className="relative aspect-video scan-box overflow-hidden flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-200 bg-black/50">
                    Scanner is idle
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  className="btn-primary text-sm px-4 py-2 disabled:opacity-60"
                  onClick={startScanner}
                  disabled={scanning}
                >
                  Start scanner
                </button>
                <button
                  className="btn-ghost text-sm px-4 py-2 disabled:opacity-60"
                  onClick={stopScanner}
                  disabled={!scanning}
                >
                  Stop
                </button>
                {lastScan && <span className="pill">Last: {lastScan}</span>}
              </div>
              {!scanSupport && <div className="text-xs text-amber-200 mt-2">BarcodeDetector not supported in this browser.</div>}
              {cameraError && <div className="text-xs text-amber-300 mt-1">{cameraError}</div>}
            </div>
            <div className="card p-4 text-xs text-slate-200 grid-ghost">
              <div className="section-title text-sm mb-2">How it works</div>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>Starts your camera and reads barcodes using the browser BarcodeDetector.</li>
                <li>Each successful scan adds the matching product (qty 1) to the active session.</li>
                <li>Use the Stop button to release the camera.</li>
              </ul>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </Section>

        <Section title="Cart" hint="Live cart totals update instantly" badge={session?.items?.length ? `${session.items.length} items` : 'Empty'}>
          {session?.items?.length ? (
            <div className="space-y-3">
              {session.items.map((i) => (
                <div key={i.barcode} className="flex justify-between items-start text-sm border-b border-slate-700 pb-2">
                  <div>
                    <div className="font-semibold text-white">{i.name}</div>
                    <div className="text-xs text-slate-400">{i.qty} × ₹{i.price} (tax {Math.round((i.taxRate || 0) * 100)}%)</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-semibold">₹{(i.price * i.qty * (1 + (i.taxRate || 0))).toFixed(2)}</div>
                    <button
                      className="btn-ghost text-rose-200 px-3 py-2"
                      onClick={() => removeItem(i.barcode)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-2 text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">Cart is empty. Add items above.</div>
          )}
          <div className="mt-4 flex gap-2">
            <button className="btn-primary" onClick={refreshSession}>
              Refresh
            </button>
          </div>
        </Section>

        <Section title="Payment & QR" hint="Apply coupons, credits, then generate signed QR">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-3">
              <div className="section-title text-sm">Rewards</div>
              <div className="pill">Credits available: ₹{credits.toFixed(2)}</div>
              <div className="pill">Piggy bank: ₹{piggyBank.toFixed(2)}</div>
              <label className="text-xs text-slate-300">Credits to redeem</label>
              <input
                className="field"
                type="number"
                min="0"
                max={credits}
                value={creditsToRedeem}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(Number(e.target.value) || 0, credits));
                  setCreditsToRedeem(val);
                }}
              />

              <div className="section-title text-sm mt-3">Coupons</div>
              {coupons.length ? (
                <div className="space-y-2">
                  {coupons.map((c) => (
                    <label key={c.code} className={`flex items-center gap-2 cursor-pointer pill ${selectedCoupon === c.code ? 'good' : ''}`}>
                      <input
                        type="radio"
                        name="coupon"
                        value={c.code}
                        checked={selectedCoupon === c.code}
                        onChange={() => setSelectedCoupon(c.code)}
                      />
                      <span className="text-sm font-semibold">{c.code}</span>
                      <span className="text-xs text-slate-200">{c.label}</span>
                    </label>
                  ))}
                  <button className="btn-ghost text-xs" onClick={() => setSelectedCoupon('')}>
                    Clear coupon
                  </button>
                </div>
              ) : (
                <div className="text-sm text-slate-400">No coupons available</div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-3">
              <div className="card p-4 grid-ghost">
                <div className="panel-title">
                  <div className="section-title text-sm">Checkout summary</div>
                  <small className="muted">Live preview</small>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-200">
                    <span>Coupon</span>
                    <span>- ₹{couponDiscountPreview.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-200">
                    <span>Credits</span>
                    <span>- ₹{creditsPreview.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-slate-700">
                    <span>Payable</span>
                    <span>₹{payablePreview.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Cashback (2%)</span>
                    <span>+ ₹{cashbackPreview.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Piggy bank savings</span>
                    <span>+ ₹{piggyPreview.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <button className="btn-primary" onClick={payAndQr}>
                  Pay (mock) & generate QR
                </button>
                {qrPayload && <div className="pill good">QR ready — show to exit gate</div>}
                {paymentQuote && (
                  <div className="pill">
                    Paid ₹{paymentQuote.finalPayableAmount.toFixed(2)} | Cashback ₹{paymentQuote.cashback.toFixed(2)} | Saved ₹
                    {paymentQuote.piggySavings.toFixed(2)}
                  </div>
                )}
              </div>

              {qrPayload && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                  <div className="flex flex-col items-center gap-2 card p-4 grid-ghost">
                    <QRCodeCanvas value={JSON.stringify(qrPayload)} size={220} includeMargin bgColor="#ffffff" fgColor="#0f172a" />
                    <div className="text-xs text-slate-300">Scan at exit to verify bill</div>
                  </div>
                  <div className="sm:col-span-2 card p-4 grid-ghost">
                    <div className="section-title text-sm mb-2">Invoice</div>
                    {session?.items?.length ? (
                      <div className="space-y-2 text-sm">
                        {session.items.map((i) => (
                          <div key={i.barcode} className="flex justify-between">
                            <div>
                              <div className="font-semibold">{i.name}</div>
                              <div className="text-xs text-slate-400">Qty {i.qty} × ₹{i.price} (tax {Math.round((i.taxRate || 0) * 100)}%)</div>
                            </div>
                            <div className="font-semibold">₹{(i.price * i.qty * (1 + (i.taxRate || 0))).toFixed(2)}</div>
                          </div>
                        ))}
                        <div className="flex justify-between font-semibold pt-2 border-t border-slate-700 mt-2">
                          <span>Total</span>
                          <span>₹{total.toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">No items</div>
                    )}
                    <div className="text-[11px] text-slate-400 mt-2">QR payload (signed) still encodes the verification data for exit gate.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Section>

        {error && <div className="text-sm text-rose-300 animate-fade-up">{error}</div>}
      </main>
    </div>
  );
}
