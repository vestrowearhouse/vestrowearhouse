import Link from 'next/link';
import { Mail, Phone, MapPin, MessageSquare, ArrowRight } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="border-b border-neutral-100 bg-neutral-50/50 py-14 sm:py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-[11px] font-bold tracking-[0.26em] uppercase text-neutral-400 mb-2">
            HELP & INQUIRIES
          </p>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-900">
            CONTACT US
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-3 max-w-lg mx-auto">
            Our support team is on standby 10:00 AM – 10:00 PM daily for size consultation, order status, and exchanges.
          </p>
        </div>
      </div>

      {/* Contact Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="grid md:grid-cols-2 gap-10 sm:gap-14">
          
          {/* Contact Details */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wider text-neutral-900 mb-2">
                Get In Touch
              </h2>
              <p className="text-xs text-neutral-500">
                Reach out directly via WhatsApp for fastest instant response or email us for order modifications.
              </p>
            </div>

            <div className="space-y-6 border border-neutral-100 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-black text-white">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Phone & WhatsApp</h3>
                  <a href="https://wa.me/8801345447500" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-neutral-700 hover:text-black transition-colors block mt-0.5">
                    +880 1345-447500
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-black text-white">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Email Inquiries</h3>
                  <a href="mailto:support@vestrowearhouse.com" className="text-sm font-semibold text-neutral-700 hover:text-black transition-colors block mt-0.5">
                    support@vestrowearhouse.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-black text-white">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Warehouse Address</h3>
                  <p className="text-sm text-neutral-700 mt-0.5">
                    House 12, Road 5, Mirpur, Dhaka, Bangladesh
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="border border-neutral-200 p-6 sm:p-8 bg-neutral-50/50">
            <h2 className="text-xl font-black uppercase tracking-wider text-neutral-900 mb-2">
              Send A Message
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Fill out the form below and we will get back to you shortly.
            </p>

            <form className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">Your Name</label>
                <input type="text" className="w-full px-4 py-2.5 bg-white border border-neutral-300 text-xs font-semibold text-neutral-900 focus:border-black focus:outline-none" placeholder="FULL NAME" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">Email Address</label>
                <input type="email" className="w-full px-4 py-2.5 bg-white border border-neutral-300 text-xs font-semibold text-neutral-900 focus:border-black focus:outline-none" placeholder="YOUR@EMAIL.COM" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">Phone Number</label>
                <input type="tel" className="w-full px-4 py-2.5 bg-white border border-neutral-300 text-xs font-semibold text-neutral-900 focus:border-black focus:outline-none" placeholder="01XXXXXXXXX" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">Message</label>
                <textarea rows={4} className="w-full px-4 py-2.5 bg-white border border-neutral-300 text-xs font-semibold text-neutral-900 focus:border-black focus:outline-none" placeholder="WRITE YOUR INQUIRY..."></textarea>
              </div>
              <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors">
                Send Message
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
