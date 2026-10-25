import Link from 'next/link';
import { ArrowLeft, RefreshCw, ShieldCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'রিটার্ন ও রিফান্ড পলিসি | StellarMartBD',
  description: 'StellarMartBD-এর সহজ ৭ দিনের রিটার্ন, রিপ্লেসমেন্ট ও রিফান্ড পলিসি। ঝামেলাহীন পণ্য পরিবর্তনের সুবিধা।',
};

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50/60 py-8 md:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> হোমপেজ
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">রিটার্ন ও রিফান্ড পলিসি</span>
        </div>

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#083b66] to-[#0d5c9e] text-white p-6 sm:p-10 rounded-2xl shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <RefreshCw className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">১০০% গ্রাহক সন্তুষ্টি গ্যারান্টি</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">৭ দিনের সহজ রিটার্ন ও রিফান্ড পলিসি</h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 max-w-2xl leading-relaxed">
            StellarMartBD-তে কেনাকাটা সম্পূর্ণ ঝুঁকিমুক্ত। পণ্য হাতে পাওয়ার পর কোনো সমস্যা বা ত্রুটি থাকলে আপনি ৭ দিনের মধ্যে সহজে রিটার্ন বা রিপ্লেসমেন্ট নিতে পারবেন।
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">৭ দিনের রিপ্লেসমেন্ট</h3>
            <p className="text-xs text-gray-500 mt-1">পণ্য ডেলিভারির ৭ দিনের মধ্যে রিকোয়েস্ট জানান</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">১০০% আসল প্রোডাক্ট</h3>
            <p className="text-xs text-gray-500 mt-1">অরিজিনাল কোয়ালিটি ও ব্র্যান্ড ওয়ারেন্টি</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">ইনস্ট্যান্ট রিফান্ড</h3>
            <p className="text-xs text-gray-500 mt-1">বিকাশ/নগদ-এ ৩-৫ কার্যদিবসে টাকা ফেরত</p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 sm:p-8 space-y-8 text-gray-700 leading-relaxed">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center">১</span>
              যেসব ক্ষেত্রে রিটার্ন বা রিপ্লেসমেন্ট প্রযোজ্য
            </h2>
            <ul className="space-y-2.5 text-sm pl-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>ডেলিভারি পাওয়ার পর পণ্যটি ভাঙা, ত্রুটিযুক্ত বা অকার্যকর (Defective/Damaged) পাওয়া গেলে।</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>অর্ডারকৃত পণ্যের সাথে প্রাপ্ত পণ্যের মডেল, সাইজ, কালার বা স্পেসিফিকেশনে অমিল থাকলে।</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>প্যাকেটের ভেতরে কোনো প্রয়োজনীয় পার্টস বা এক্সেসরিজ অনুপস্থিত থাকলে।</span>
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center">২</span>
              রিটার্ন করার শর্তাবলী
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 border border-gray-100">
              <p>• পণ্যটির মূল প্যাকেজিং, ইউজার ম্যানুয়াল, ওয়ারেন্টি কার্ড এবং ইনভয়েস অক্ষত থাকতে হবে।</p>
              <p>• অসাবধানতাবশত নিজে ভেঙে ফেলা বা বৈদ্যুতিক শর্ট সার্কিটের কারণে ক্ষতিগ্রস্ত পণ্যের ক্ষেত্রে রিটার্ন প্রযোজ্য হবে না।</p>
              <p>• ডেলিভারি পাওয়ার পর আনবক্সিং করার সময় একটি ছোট ভিডিও বা ছবি তুলে রাখা উৎসাহিত করা হয়।</p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center">৩</span>
              কীভাবে রিটার্ন বা রিপ্লেসমেন্ট রিকোয়েস্ট করবেন?
            </h2>
            <div className="space-y-3 text-sm">
              <p>
                আপনার অর্ডার আইডি এবং সমস্যার ছবি/ভিডিও সহ আমাদের সরাসরি WhatsApp নাম্বারে (<strong>+880 1345-447500</strong>) মেসেজ দিন।
              </p>
              <p>
                আমাদের সাপোর্ট টিম তথ্য যাচাই করে দ্রুত পিকআপ অথবা ড্রপ-অফের মাধ্যমে রিপ্লেসমেন্ট পণ্য পাঠিয়ে দেবে।
              </p>
              <div className="pt-2">
                <a
                  href="https://wa.me/8801345447500?text=Hello%20StellarMartBD,%20I%20want%20to%20request%20a%20return/replacement."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors text-sm shadow-sm"
                >
                  💬 WhatsApp-এ রিটার্ন রিকোয়েস্ট করুন
                </a>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center">৪</span>
              রিফান্ড প্রক্রিয়া ও সময়সীমা
            </h2>
            <p className="text-sm">
              যদি রিপ্লেসমেন্ট স্টক না থাকে বা আপনি টাকা ফেরত চান, তবে পণ্যটি আমাদের কাছে পৌঁছানোর এবং কোয়ালিটি যাচাইয়ের পর <strong>৩ থেকে ৫ কার্যদিবসের মধ্যে</strong> আপনার বিকাশ, নগদ বা ব্যাংক অ্যাকাউন্টে রিফান্ডের পুরো টাকা পাঠিয়ে দেওয়া হবে।
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
