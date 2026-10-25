import Link from 'next/link';
import { ArrowLeft, Truck, Banknote, ShieldCheck, Clock, MapPin, PackageCheck } from 'lucide-react';

export const metadata = {
  title: 'শিপিং ও ডেলিভারি পলিসি | StellarMartBD',
  description: 'StellarMartBD-এর ডেলিভারি চার্জ, ক্যাশ অন ডেলিভারি (COD) পলিসি ও ডেলিভারি সময়সীমা। সারা বাংলাদেশে দ্রুত হোম ডেলিভারি।',
};

export default function DeliveryPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50/60 py-8 md:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> হোমপেজ
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">শিপিং ও ডেলিভারি পলিসি</span>
        </div>

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 sm:p-10 rounded-2xl shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Truck className="w-6 h-6 text-yellow-300" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-300">সারা বাংলাদেশে ক্যাশ অন ডেলিভারি</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">শিপিং ও ডেলিভারি পলিসি</h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 max-w-2xl leading-relaxed">
            StellarMartBD গ্রাহকদের দ্রুততম সময়ে নিখুঁতভাবে পণ্য পৌঁছে দিতে নির্ভরযোগ্য কুরিয়ার পার্টনারদের মাধ্যমে সারা দেশে হোম ডেলিভারি সেবা প্রদান করে থাকে।
          </p>
        </div>

        {/* Quick Charge Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-xs flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-blue-600 tracking-wider">ঢাকার ভিতরে</span>
              <h3 className="text-2xl font-black text-gray-900 mt-0.5">৳ ৬০</h3>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> ডেলিভারি সময়: ২৪ থেকে ৪৮ ঘণ্টা
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-xs flex items-start gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-indigo-600 tracking-wider">ঢাকার বাইরে (সারা দেশ)</span>
              <h3 className="text-2xl font-black text-gray-900 mt-0.5">৳ ১২০</h3>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> ডেলিভারি সময়: ২ থেকে ৪ কার্যদিবস
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 sm:p-8 space-y-8 text-gray-700 leading-relaxed">
          
          {/* Section 1: Cash On Delivery */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" />
              ক্যাশ অন ডেলিভারি (Cash on Delivery)
            </h2>
            <p className="text-sm">
              বাংলাদেশের যেকোনো প্রান্ত থেকে আপনি ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারবেন। কোনো অগ্রিম পেমেন্টের ঝুঁকি ছাড়া ডেলিভারি রাইডার আপনার ঠিকানায় পণ্য পৌঁছে দিলে আপনি দেখে মূল্য পরিশোধ করবেন।
            </p>
          </section>

          {/* Section 2: Parcel Inspection */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-blue-600" />
              রাইডারের সামনে পার্সেল চেক করার সুযোগ
            </h2>
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-950 space-y-1.5">
              <p className="font-semibold text-emerald-900">ডেলিভারির সময় করণীয়:</p>
              <p>১. ডেলিভারি রাইডারের উপস্থিতিতে পার্সেলের বাইরের অবস্থা ও সঠিক পণ্য এসেছে কি না চেক করুন।</p>
              <p>২. কোনো দৃশ্যমান ক্ষতি বা ত্রুটি দেখলে সাথে সাথে রাইডারের কাছে পার্সেল ফেরত দিন অথবা আমাদের হটলাইনে কল করুন।</p>
            </div>
          </section>

          {/* Section 3: Delivery Partners */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              আমাদের ডেলিভারি পার্টনার্স
            </h2>
            <p className="text-sm">
              আমরা স্টেডফাস্ট (Steadfast), রেডএক্স (RedX), এবং সুন্দরবন কুরিয়ারের মাধ্যমে নিরাপদে পণ্য ডেলিভারি করে থাকি। অর্ডার নিশ্চিত হওয়ার পর এসএমএস ও ট্র্যাকিং কোড পাঠিয়ে দেওয়া হয় যাতে আপনি আপনার অর্ডারের রিয়েল-টাইম অবস্থান ট্র্যাক করতে পারেন।
            </p>
          </section>

          {/* Contact Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="font-bold text-gray-900">ডেলিভারি সংক্রান্ত কোনো জিজ্ঞাসা আছে?</p>
              <p className="text-xs text-gray-500 mt-0.5">আমাদের সাপোর্ট টিম প্রতিদিন সকাল ১০টা থেকে রাত ১০টা পর্যন্ত সক্রিয়।</p>
            </div>
            <a
              href="https://wa.me/8801345447500?text=Hello%20StellarMartBD,%20I%20have%20a%20delivery%20query."
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#083b66] hover:bg-[#062d4d] text-white font-semibold rounded-lg text-xs transition-colors shrink-0"
            >
              সাপোর্টে কথা বলুন →
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
