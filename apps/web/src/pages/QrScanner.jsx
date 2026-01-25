import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';

const api = axios.create({ baseURL: 'http://localhost:4000' });

export default function QrScanner() {
  const [payload, setPayload] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState('Idle');
  const scannerRef = useRef(null);
  const scannerId = 'qr-reader';

  useEffect(() => {
    if (!cameraOn) return undefined;
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: 240 },
        (decodedText) => {
          setStatus('Scanned');
          setPayload(decodedText);
          autoVerify(decodedText);
        },
        () => {
          // ignore scan errors for continuous read
        }
      )
      .then(() => setStatus('Scanning...'))
      .catch((err) => {
        console.error(err);
        setError('Camera start failed. Ensure permission is granted.');
        setCameraOn(false);
      });

    return () => {
      // Ensure camera is released when leaving the page or toggling off
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, [cameraOn]);

  async function autoVerify(rawText) {
    try {
      setError('');
      const parsed = JSON.parse(rawText);
      const res = await api.post('/verify-qr', { qrPayload: parsed });
      setResult(res.data);
      setStatus('Verified');
    } catch (err) {
      console.error(err);
      setResult(null);
      setStatus('Scan ok, payload not JSON');
      setError('Scan read, but payload is not valid JSON.');
    }
  }

  async function verify() {
    try {
      setError('');
      const parsed = JSON.parse(payload);
      const res = await api.post('/verify-qr', { qrPayload: parsed });
      setResult(res.data);
      setStatus('Verified');
    } catch (err) {
      setResult(null);
      setStatus('Idle');
      setError('Invalid JSON or request failed');
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="panel-title animate-fade-up">
        <div className="section-title">QR Scanner</div>
        <div className="pill">
          Status: <strong className="text-white">{status}</strong>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-delayed">
        <div className="lg:col-span-1 card p-5 grid-ghost">
          <div className="panel-title">
            <div className="section-title">Camera Scanner</div>
            <small>Continuous scan</small>
          </div>
          <div className="space-y-3">
            <button className="btn-primary w-full" onClick={() => setCameraOn((v) => !v)}>
              {cameraOn ? 'Stop camera' : 'Start camera'}
            </button>
            <div className="scan-box min-h-[260px] flex items-center justify-center bg-transparent">
              <div id={scannerId} className="w-full" />
              {!cameraOn && <div className="text-sm text-slate-300 px-3 text-center">Camera off. Click start to scan.</div>}
            </div>
            <div className="text-xs text-slate-400">Localhost is allowed for camera access; on HTTPS origins this will also work on mobile.</div>
          </div>
          {error && <div className="text-sm text-rose-300 mt-3">{error}</div>}
        </div>

        <div className="lg:col-span-1 card p-5 grid-ghost">
          <div className="panel-title">
            <div className="section-title">Manual / Paste Payload</div>
            <small>JSON only</small>
          </div>
          <textarea
            className="field h-48"
            placeholder='{"sessionId":"...","sig":"..."}'
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
          />
          <button className="mt-3 btn-primary w-full" onClick={verify}>
            Verify
          </button>
          {error && !cameraOn && <div className="text-sm text-rose-300 mt-2">{error}</div>}
        </div>

        <div className="lg:col-span-1 card p-5 grid-ghost min-h-48">
          <div className="panel-title">
            <div className="section-title">Result</div>
            <small>API response</small>
          </div>
          {result ? (
            <pre className="text-xs code-block text-slate-100 rounded p-3 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          ) : (
            <div className="text-sm text-slate-400">Awaiting scan...</div>
          )}
        </div>
      </div>
    </div>
  );
}
