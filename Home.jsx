import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div id="top" className="min-h-screen text-slate-100 relative">
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
            <Link className="nav-pill nav-pill--active" to="/">
              Home
            </Link>
            <Link className="btn-primary text-sm px-4 py-2" to="/app">
              Start shopping
            </Link>
          </div>
        </div>
      </header>

      <main className="page-shell space-y-12">
        <div className="grid gap-8 lg:grid-cols-2 items-start animate-fade-up">
          <div className="space-y-4">
            <div className="badge-soft w-fit">Frictionless in-store checkout</div>
            <div className="text-4xl sm:text-5xl font-bold leading-tight text-white">
              Shop freely. Scan as you go. Skip the checkout line.
            </div>
            <p className="text-base text-slate-200 leading-relaxed">
              Smart Cart turns your phone into a self-checkout lane. Start a store session, scan items, apply rewards, pay,
              and leave with a signed QR that clears the exit gate. Everything stays synced with the store for accurate totals
              and verification.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="pill good">Camera barcode scans</span>
              <span className="pill">Live cart + taxes</span>
              <span className="pill">Rewards & coupons</span>
              <span className="pill">Exit-gate QR proof</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="btn-primary px-5 py-3" to="/app">
                Launch shopping
              </Link>
              <a className="btn-ghost px-5 py-3" href="#how-it-works">
                How it works
              </a>
            </div>
          </div>

          <div className="card p-5 grid-ghost space-y-4">
            <div className="section-title text-lg">Live session snapshot</div>
            <div className="space-y-3 text-sm text-slate-200">
              <div className="flex justify-between">
                <span>Store session</span>
                <span className="pill">Linked to store</span>
              </div>
              <div className="flex justify-between">
                <span>Cart sync</span>
                <span className="pill good">Realtime</span>
              </div>
              <div className="flex justify-between">
                <span>Rewards</span>
                <span className="pill">Cashback + piggy bank</span>
              </div>
              <div className="flex justify-between">
                <span>Exit verification</span>
                <span className="pill">Signed QR invoice</span>
              </div>
            </div>
            <div className="card p-4 grid-ghost">
              <div className="section-title text-sm mb-2">Why stores love it</div>
              <ul className="list-disc list-inside space-y-2 text-sm text-slate-200">
                <li>Checkout lanes move faster without extra hardware.</li>
                <li>Inventory stays aligned because every scan is logged.</li>
                <li>Staff see live carts and QR proofs for quick verification.</li>
              </ul>
            </div>
          </div>
        </div>

        <section id="how-it-works" className="space-y-5">
          <div className="section-title">How to use Smart Cart</div>
          <div className="grid gap-4 lg:grid-cols-3">
            {["Log in & pick store","Start a live session","Scan items or add manually","Apply coupons & credits","Pay to generate QR","Show QR at exit"].map((step, idx) => (
              <div key={step} className="card p-4 grid-ghost space-y-2">
                <div className="flex items-center gap-2">
                  <span className="pill">Step {idx + 1}</span>
                  <span className="text-sm font-semibold text-white">{step}</span>
                </div>
                <p className="text-sm text-slate-200">
                  {[
                    'Use your user ID or try the demo account and choose the store you are in.',
                    'Create a session so pricing, taxes, and inventory match your location.',
                    'Use the camera barcode scanner or pick products from the catalog list.',
                    'Stack available coupons or credits and preview savings instantly.',
                    'Confirm totals, pay (mock), and get a signed QR invoice tied to your cart.',
                    'Present the QR at the exit lane to verify items and payment in seconds.'
                  ][idx]}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div className="section-title">Why shoppers choose Smart Cart</div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card p-4 grid-ghost space-y-2">
              <div className="pill good w-fit">Fast</div>
              <div className="text-lg font-semibold">No lines, no kiosks</div>
              <p className="text-sm text-slate-200">Scan as you shop and walk out with a verified QR instead of waiting at checkout.</p>
            </div>
            <div className="card p-4 grid-ghost space-y-2">
              <div className="pill w-fit">Transparent</div>
              <div className="text-lg font-semibold">Live totals</div>
              <p className="text-sm text-slate-200">Taxes, coupons, and credits are calculated instantly so there are no surprises.</p>
            </div>
            <div className="card p-4 grid-ghost space-y-2">
              <div className="pill w-fit">Rewarding</div>
              <div className="text-lg font-semibold">Cashback + piggy bank</div>
              <p className="text-sm text-slate-200">Earn cashback, round-up savings, and redeem credits right from your cart.</p>
            </div>
          </div>
        </section>

        <section className="card p-6 grid-ghost space-y-3">
          <div className="section-title">Get started</div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
            <span className="pill">Supported in-store only</span>
            <span className="pill">One session per store</span>
            <span className="pill">Camera permissions required</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="btn-primary px-5 py-3" to="/app">
              Open the user portal
            </Link>
            <a className="btn-ghost px-5 py-3" href="#top">
              Back to top
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
