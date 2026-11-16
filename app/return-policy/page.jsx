import Link from 'next/link';
import { ArrowLeft, RefreshCw, ShieldCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Return & Exchange Policy | Vestro Wear House',
  description: 'Vestro Wear House hassle-free 7-day return and size exchange policy for premium streetwear and apparel.',
};

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-white py-10 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-xs uppercase tracking-wider text-neutral-400">
          <Link href="/" className="hover:text-black flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-bold">Return & Exchange</span>
        </div>

        {/* Header Banner */}
        <div className="bg-black text-white p-8 sm:p-12 mb-10">
          <div className="flex items-center gap-3 mb-3">
            <RefreshCw className="w-5 h-5 text-white" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-300">100% Satisfaction Guarantee</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">7-Day Return & Exchange</h1>
          <p className="mt-3 text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
            Shopping at Vestro Wear House is risk-free. If you need a size exchange or receive a defective item, our 7-day exchange process is seamless and quick.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <div className="p-6 border border-neutral-200 bg-neutral-50/50 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">7 Days Exchange</h3>
            <p className="text-xs text-neutral-500 mt-1">Request within 7 days of package delivery</p>
          </div>

          <div className="p-6 border border-neutral-200 bg-neutral-50/50 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">Authentic Apparel</h3>
            <p className="text-xs text-neutral-500 mt-1">100% genuine combed cotton & high GSM fabrics</p>
          </div>

          <div className="p-6 border border-neutral-200 bg-neutral-50/50 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center mb-3">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">Rapid Processing</h3>
            <p className="text-xs text-neutral-500 mt-1">Instant replacement or bKash refund in 3-5 days</p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="border border-neutral-100 p-6 sm:p-10 space-y-8 text-neutral-700 leading-relaxed text-sm">
          
          <section>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-neutral-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-black text-white text-xs font-bold flex items-center justify-center">1</span>
              Eligible Reasons for Exchange
            </h2>
            <ul className="space-y-2.5 text-xs text-neutral-600 pl-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
                <span>Size mismatch (need a smaller or larger size).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
                <span>Manufacturing defect or stitching flaws.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
                <span>Received wrong product or wrong color variant.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-neutral-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-black text-white text-xs font-bold flex items-center justify-center">2</span>
              Conditions for Return
            </h2>
            <div className="bg-neutral-50 border border-neutral-200 p-4 text-xs space-y-2 text-neutral-800">
              <p>• The item must be unwashed, unworn, and with original brand tags attached.</p>
              <p>• Items damaged by misuse or deliberate tearing are not eligible for exchange.</p>
              <p>• Please inform our support team via WhatsApp with your order number.</p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-neutral-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-black text-white text-xs font-bold flex items-center justify-center">3</span>
              How to Request an Exchange or Return
            </h2>
            <div className="space-y-3 text-xs text-neutral-700">
              <p>
                Send a message to our official WhatsApp support at <strong>+880 1345-447500</strong> with your Order ID and photos/videos of the item.
              </p>
              <p>
                Our quality check team will approve the exchange and dispatch the replacement piece via doorstep courier.
              </p>
              <div className="pt-2">
                <a
                  href="https://wa.me/8801345447500?text=Hello%20Vestro%20Wear%20House,%20I%20want%20to%20request%20an%20exchange."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-wider rounded-lg transition-colors text-xs"
                >
                  Message Support on WhatsApp →
                </a>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-neutral-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-black text-white text-xs font-bold flex items-center justify-center">4</span>
              Refund Process & Timeline
            </h2>
            <p className="text-xs text-neutral-600">
              In cases where the replacement size is out of stock or you request a full refund, our accounts department will process the refund to your bKash, Nagad, or Bank account within <strong>3 to 5 business days</strong> after receiving the returned parcel.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
