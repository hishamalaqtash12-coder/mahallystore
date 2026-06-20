import Image from "next/image";
import Link from "next/link";
import { Store, ShoppingBag, Truck, Heart, Users, Globe, ShieldCheck, Zap } from "lucide-react";

export const metadata = {
  title: "About Us - Mahally Jo",
  description: "Mahally is a specialized digital platform connecting local Jordanian stores, projects, and factories with customers nationwide.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* 1. Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center text-white overflow-hidden">
        <img
          src="https://www.salesforce.com/blog/wp-content/uploads/sites/2/2020/08/About-Us-Page.jpg"
          alt="Mahally local market"
          className="absolute inset-0 w-full h-full object-cover brightness-[0.4]"
        />
        <div className="relative z-10 max-w-[900px] mx-auto text-center px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
            Empowering Local <span className="text-brand">Communities</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-[700px] mx-auto leading-relaxed">
            Connecting traditional Jordanian craftsmanship with the modern digital economy. Mahally is the bridge between your favorite local store and your doorstep.
          </p>
        </div>
      </section>

      {/* 2. Introduction Section */}
      <section className="py-24 px-4 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-light text-brand rounded-full text-sm font-bold uppercase tracking-wider">
              <Globe size={16} />
              <span>Digital Transformation</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 leading-tight">
              A Specialized Digital Platform for Local Growth
            </h2>
            <p className="text-zinc-600 text-lg leading-relaxed">
              Mahally is more than just a marketplace; it's a dedicated ecosystem designed to attract and support local stores, projects, and factories. We provide every merchant with a professional digital storefront, integrated payment solutions, and reliable delivery services.
            </p>
            <p className="text-zinc-600 text-lg leading-relaxed">
              Our mission is to facilitate the reach of local products to every corner of the Kingdom, ensuring the continuity of traditional businesses while contributing significantly to the national economy.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-zinc-50 p-8 rounded-2xl border border-zinc-100 flex flex-col items-center text-center">
              <Store size={40} className="text-brand mb-4" />
              <h3 className="text-2xl font-bold text-zinc-900 mb-1">500+</h3>
              <p className="text-zinc-500 text-sm font-medium">Local Merchants</p>
            </div>
            <div className="bg-zinc-50 p-8 rounded-2xl border border-zinc-100 flex flex-col items-center text-center">
              <ShoppingBag size={40} className="text-brand mb-4" />
              <h3 className="text-2xl font-bold text-zinc-900 mb-1">10k+</h3>
              <p className="text-zinc-500 text-sm font-medium">Products Listed</p>
            </div>
            <div className="bg-zinc-50 p-8 rounded-2xl border border-zinc-100 flex flex-col items-center text-center">
              <Users size={40} className="text-brand mb-4" />
              <h3 className="text-2xl font-bold text-zinc-900 mb-1">Jordan</h3>
              <p className="text-zinc-500 text-sm font-medium">All Governorates</p>
            </div>
            <div className="bg-zinc-50 p-8 rounded-2xl border border-zinc-100 flex flex-col items-center text-center">
              <Truck size={40} className="text-brand mb-4" />
              <h3 className="text-2xl font-bold text-zinc-900 mb-1">Fast</h3>
              <p className="text-zinc-500 text-sm font-medium">Reliable Delivery</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Mahally Experience (Why Us) */}
      <section className="bg-brand-dark py-24 text-white">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">One Market… Boundless Products</h2>
            <p className="text-white/60 max-w-[700px] mx-auto text-lg">
              We shortened the distances so you can shop from your favorite local stores, no matter where you are in Jordan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm p-10 rounded-2xl border border-white/10 hover:border-brand/30 transition-all group">
              <div className="w-14 h-14 bg-brand-light rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap size={28} className="text-brand-dark" />
              </div>
              <h3 className="text-xl font-bold mb-4">Same Shop Prices</h3>
              <p className="text-white/70 leading-relaxed">
                Enjoy the exact same prices you would find in the physical shop. We ensure transparency and fairness in every transaction.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-10 rounded-2xl border border-white/10 hover:border-brand/30 transition-all group">
              <div className="w-14 h-14 bg-brand-light rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck size={28} className="text-brand-dark" />
              </div>
              <h3 className="text-xl font-bold mb-4">Trusted Quality</h3>
              <p className="text-white/70 leading-relaxed">
                Every merchant on Mahally is verified. We take pride in showcasing the authentic quality of Jordanian craftsmanship.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-10 rounded-2xl border border-white/10 hover:border-brand/30 transition-all group">
              <div className="w-14 h-14 bg-brand-light rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Truck size={28} className="text-brand-dark" />
              </div>
              <h3 className="text-xl font-bold mb-4">Doorstep Delivery</h3>
              <p className="text-white/70 leading-relaxed">
                Fast, reliable, and secure. We handle the logistics so you can focus on enjoying your local finds from across the country.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Support Local Section */}
      <section className="py-24 px-4 max-w-[1280px] mx-auto text-center">
        <div className="bg-zinc-50 rounded-[32px] p-12 md:p-20 border border-zinc-100">
          <Heart size={64} className="text-brand mx-auto mb-8 animate-pulse" />
          <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 mb-6">Support Your Neighborhood</h2>
          <p className="text-zinc-600 text-lg md:text-xl max-w-[800px] mx-auto mb-10 leading-relaxed">
            By choosing Mahally, you are directly supporting the growth of local entrepreneurs, artisans, and family-owned businesses. Your purchase fuels the national economy and keeps our local heritage alive.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/browse" className="w-full sm:w-auto h-[52px] px-10 bg-brand hover:bg-brand-dark text-white rounded-full flex items-center justify-center font-bold text-lg shadow-sm transition-all">
              Browse Products
            </Link>
            <Link href="/register" className="w-full sm:w-auto h-[52px] px-10 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-900 rounded-full flex items-center justify-center font-bold text-lg shadow-sm transition-all">
              Become a Seller
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Footer Spacer */}
      <div className="h-20" />

    </div>
  );
}
