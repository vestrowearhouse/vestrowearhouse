export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <p className="text-[11px] font-bold tracking-[0.26em] uppercase text-neutral-400 mb-2">LEGAL</p>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-900">Terms of Service</h1>
          <p className="text-xs text-neutral-500 mt-2">Vestro Wear House · Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="border border-neutral-100 p-6 sm:p-10 space-y-8 text-neutral-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 mb-2">1. Account & Security</h2>
            <p>Customers must provide accurate contact and shipping information when ordering. Accounts are confidential.</p>
          </section>
          
          <section>
            <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 mb-2">2. Orders & Availability</h2>
            <p>All streetwear collections are subject to stock availability. We reserve the right to cancel or verify orders suspected of fraud.</p>
          </section>
          
          <section>
            <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 mb-2">3. Pricing & Payments</h2>
            <p>Prices are listed in Bangladeshi Taka (BDT). We accept Cash on Delivery (COD) as well as secure mobile payments (bKash).</p>
          </section>
          
          <section>
            <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 mb-2">4. Support Inquiries</h2>
            <p>For any inquiries regarding terms or orders, contact us at <a href="mailto:support@vestrowearhouse.com" className="font-bold text-neutral-900 underline">support@vestrowearhouse.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

