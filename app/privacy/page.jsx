export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <p className="text-[11px] font-bold tracking-[0.26em] uppercase text-neutral-400 mb-2">PRIVACY & TRUST</p>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-900">Privacy Policy</h1>
          <p className="text-xs text-neutral-500 mt-2">Vestro Wear House · Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="border border-neutral-100 p-6 sm:p-10 space-y-8 text-neutral-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 mb-2">1. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1 text-xs text-neutral-600">
              <li>Contact data (Full name, phone number, shipping address)</li>
              <li>Order history and apparel sizing preferences</li>
              <li>Encrypted transaction confirmation IDs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 mb-2">2. How We Use Data</h2>
            <p>Your details are strictly used to fulfill and dispatch your orders, provide shipment SMS updates, and facilitate seamless exchanges.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 mb-2">3. Data Protection</h2>
            <p>We do not share, sell, or rent your personal information to third-party advertisers. All customer transactions are protected with industry-standard encryption.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 mb-2">4. Contact & Privacy Requests</h2>
            <p>For any privacy inquiries or account deletion requests, email us directly at <a href="mailto:support@vestrowearhouse.com" className="font-bold text-neutral-900 underline">support@vestrowearhouse.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

