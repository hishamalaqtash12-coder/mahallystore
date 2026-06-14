import { Truck } from "lucide-react";

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-white py-20 px-4 font-sans">
      <div className="container mx-auto max-w-3xl">
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-10 md:p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-[#007185] mx-auto mb-6 shadow-sm">
            <Truck size={28} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-4">Shipping Rates & Policies</h1>
          <p className="text-zinc-600 text-sm md:text-base leading-relaxed">
            Content pending client request. This page will be updated with the official shipping rates, delivery timelines, and courier policies shortly.
          </p>
        </div>
      </div>
    </div>
  );
}
