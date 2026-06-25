import { MapPin, Phone, Mail, Clock, Send, MessageSquare } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white pb-20 font-sans">
      <div className="bg-zinc-50 border-b border-zinc-200 py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold text-zinc-900 mb-4">Contact Us</h1>
          <p className="text-zinc-600 text-sm md:text-base">We're here to help you with anything you need. Reach out to the Mahally team.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-zinc-900 mb-6">Send us a Message</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-800">Full Name</label>
                  <input type="text" className="w-full h-11 bg-white border border-zinc-300 rounded-md px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-800">Email Address</label>
                  <input type="email" className="w-full h-11 bg-white border border-zinc-300 rounded-md px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all" placeholder="john@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-800">Subject</label>
                <input type="text" className="w-full h-11 bg-white border border-zinc-300 rounded-md px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all" placeholder="How can we help?" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-800">Message</label>
                <textarea className="w-full h-32 bg-white border border-zinc-300 rounded-md p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all resize-none" placeholder="Write your message here..."></textarea>
              </div>
              <button className="h-11 bg-brand hover:bg-brand-dark text-white w-full md:w-auto px-8 rounded-full font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2">
                <Send size={16} /> Send Message
              </button>
            </form>
          </div>

          {/* Contact Info Cards */}
          <div className="space-y-6">
            <div className="bg-zinc-50 rounded-xl p-6 border border-zinc-200">
              <h3 className="text-lg font-bold text-zinc-900 mb-6">Contact Details</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-brand shrink-0 shadow-sm">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">Phone</p>
                    <p className="text-sm text-zinc-600 mt-1">+962 7X XXX XXXX</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-brand shrink-0 shadow-sm">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">Email</p>
                    <p className="text-sm text-zinc-600 mt-1">hello@mahally.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-brand shrink-0 shadow-sm">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">Office</p>
                    <p className="text-sm text-zinc-600 mt-1">Amman, Jordan<br />King Abdullah II St.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-brand shrink-0 shadow-sm">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">Hours</p>
                    <p className="text-sm text-zinc-600 mt-1">Sun - Thu: 9AM - 6PM</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-brand-dark rounded-xl p-6 text-white text-center">
              <MessageSquare size={32} className="mb-4 mx-auto text-zinc-300" />
              <h3 className="text-lg font-bold mb-2">Live Chat Support</h3>
              <p className="text-sm text-zinc-300 mb-6 leading-relaxed">Need instant help? Our support agents are online 24/7 to assist you.</p>
              <button className="h-10 px-6 bg-white text-zinc-900 hover:bg-zinc-100 rounded-full text-sm font-bold shadow-sm w-full transition-colors">Start Chat</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
