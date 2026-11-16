import Link from 'next/link';
import { ArrowLeft, Truck, Banknote, ShieldCheck, Clock, MapPin, PackageCheck } from 'lucide-react';

export const metadata = {
  title: 'Shipping & Delivery Policy | Vestro Wear House',
  description: 'Vestro Wear House shipping charges, Cash on Delivery (COD) policy, and delivery timeline across Bangladesh.',
};

export default function DeliveryPolicyPage() {
  return (
    <div className="min-h-screen bg-white py-10 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-xs uppercase tracking-wider text-neutral-400">
          <Link href="/" className="hover:text-black flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-bold">Shipping & Delivery</span>
        </div>

        {/* Header Banner */}
        <div className="bg-black text-white p-8 sm:p-12 mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Truck className="w-5 h-5 text-white" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-300">Nationwide Cash On Delivery</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">Shipping & Delivery Policy</h1>
          <p className="mt-3 text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
            Vestro Wear House delivers nationwide across all 64 districts in Bangladesh with reliable courier partners and full parcel inspection on delivery.
          </p>
        </div>

        {/* Quick Charge Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <div className="p-6 border border-neutral-200 bg-neutral-50/50 flex items-start gap-4">
            <div className="p-3 bg-black text-white">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Inside Dhaka</span>
              <h3 className="text-2xl font-black text-neutral-900 mt-0.5">৳ ৭০</h3>
              <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-400" /> Delivery: 24 to 48 Hours
              </p>
            </div>
          </div>

          <div className="p-6 border border-neutral-200 bg-neutral-50/50 flex items-start gap-4">
            <div className="p-3 bg-black text-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Outside Dhaka (Nationwide)</span>
              <h3 className="text-2xl font-black text-neutral-900 mt-0.5">৳ ১৩০</h3>
              <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-400" /> Delivery: 2 to 4 Business Days
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="border border-neutral-100 p-6 sm:p-10 space-y-8 text-neutral-700 leading-relaxed text-sm">
          
          {/* Section 1: Cash On Delivery */}
          <section>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-neutral-900 mb-3 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-neutral-900" />
              Cash on Delivery (COD)
            </h2>
            <p>
              You can place orders with 100% Cash on Delivery from anywhere in Bangladesh. Pay the rider upon receiving and checking your apparel package at your doorstep.
            </p>
          </section>

          {/* Section 2: Parcel Inspection */}
          <section>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-neutral-900 mb-3 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-neutral-900" />
              Doorstep Parcel Checking
            </h2>
            <div className="bg-neutral-50 border border-neutral-200 p-4 space-y-1.5 text-xs text-neutral-800">
              <p className="font-bold uppercase tracking-wider text-neutral-900">Delivery Guidelines:</p>
              <p>1. Check the exterior parcel and size/color of the apparel in the presence of the delivery rider.</p>
              <p>2. If you notice any damage or incorrect size, you can instantly hand it back to the rider or message our helpline.</p>
            </div>
          </section>

          {/* Section 3: Delivery Partners */}
          <section>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-neutral-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-neutral-900" />
              Trusted Logistics Partners
            </h2>
            <p>
              We partner with Steadfast, Pathao, and RedX for rapid, insured nationwide deliveries. You receive real-time SMS updates with live tracking links once your package is dispatched.
            </p>
          </section>

          {/* Contact Box */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="font-bold uppercase tracking-wider text-neutral-900">Need Delivery Assistance?</p>
              <p className="text-neutral-500 mt-0.5">Our support team is available everyday from 10:00 AM to 10:00 PM.</p>
            </div>
            <a
              href="https://wa.me/8801345447500?text=Hello%20Vestro%20Wear%20House,%20I%20have%20a%20delivery%20query."
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-wider rounded-lg text-xs transition-colors shrink-0"
            >
              Contact Support →
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
